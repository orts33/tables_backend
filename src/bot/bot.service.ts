import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Start, Update, InjectBot, Ctx, Action, Command } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { UserService } from '../user/user.service';
import { PaymentsService } from '../payment/payments.service';
import * as process from 'node:process';

@Update()
@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);

    constructor(
        private readonly userService: UserService,
        private readonly paymentsService: PaymentsService,
        @InjectBot() private readonly bot: Telegraf,
    ) {}


    // --- состояние выбора суммы пополнения ---
    private userTopupSelections: Map<number, number> = new Map();

    async onModuleInit() {
        this.logger.log('🚀 Telegram бот инициализирован');

        const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
        if (adminTelegramId) {
            try {
                await this.bot.telegram.sendMessage(
                    adminTelegramId,
                    `🤖 Bot запущен успешно!\n<b>Добро пожаловать в панель управления.</b>\n\n<i>Подключено:</i> ${new Date().toLocaleString()}`,
                    { parse_mode: 'HTML' }
                );
                this.logger.log(`✅ Уведомление отправлено админу: ${adminTelegramId}`);
            } catch (error) {
                this.logger.error(`❌ Ошибка отправки админу: ${error.message}`);
            }
        } else {
            this.logger.warn('⚠️ ADMIN_TELEGRAM_ID не указан в .env');
        }
    }

    @Start()
    @Command('start')
    async handleStart(@Ctx() ctx: any) {
        const { id, username, first_name, last_name } = ctx.from;
        const telegramId = id.toString();
        const startParam = ctx.startPayload || '';
        const photoUrl = await this.getUserPhoto(id);

        let referrerId: string | null = null;
        if (startParam.startsWith('ref_')) {
            const extractedId = startParam.replace('ref_', '');
            if (extractedId === telegramId) {
                await ctx.reply('🙃 Вы не можете использовать собственную реферальную ссылку.');
            } else {
                referrerId = extractedId;
            }
        }

        try {
            await this.userService.registerUser({
                telegramId,
                username,
                firstName: first_name,
                lastName: last_name,
                photoUrl,
                referrerId,
            });

            this.logger.log(
                `👤 Пользователь ${telegramId} зарегистрирован${referrerId ? ` (реф: ${referrerId})` : ''}`
            );

            const referralLink = `https://t.me/${process.env.TELEGRAM_BOT_NAME}?start=ref_${telegramId}`;

            await ctx.reply(
                `🎉 <b>Добро пожаловать в TableMaster, ${first_name || 'Игрок'}!</b>\n\n` +
                `📨 <i>Вы можете приглашать друзей и зарабатывать награды!</i>\n\n` +
                `🔗 <b>Ваша персональная реферальная ссылка:</b>\n` +
                `${referralLink}\n\n` +
                `🎁 <b>За каждых 5 активных рефералов</b> вы получаете <b>бонусные монеты</b>! 🪙\n\n` +
                `👇 Выберите действие ниже:`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '🚀 Открыть Mini App',
                                    web_app: { url: process.env.MINI_APP_URL },
                                },
                            ],
                            [
                                { text: '💰 Финансы', callback_data: 'finance_menu' },
                            ],
                            [
                                {
                                    text: '🔗 Получить пригласительную ссылку',
                                    callback_data: `copy_ref_${telegramId}`,
                                },
                            ],
                            [
                                {
                                    text: '🔁 Повторно открыть /start',
                                    callback_data: `repeat_start_${telegramId}`,
                                },
                            ],
                        ],
                    },
                }
            );
        } catch (error) {
            this.logger.error(`Ошибка при регистрации ${telegramId}: ${error.message}`);
            await ctx.reply('⚠️ Произошла ошибка при регистрации. Попробуйте чуть позже!');
        }
    }

    @Action(/copy_ref_(.+)/)
    async handleCopyReferral(@Ctx() ctx: any) {
        const telegramId = ctx.match[1];
        const referralLink = `https://t.me/${process.env.TELEGRAM_BOT_NAME}?start=ref_${telegramId}`;
        await ctx.reply(`🔗 Вот ваша ссылка:\n${referralLink}`);
    }

    @Action(/repeat_start_(.+)/)
    async handleRepeatStart(@Ctx() ctx: any) {
        const telegramId = ctx.match[1];
        ctx.startPayload = '';
        await this.handleStart(ctx);
    }

    @Command('withdraw')
    async handleWithdraw(@Ctx() ctx: any) {
        await ctx.reply('💸 Для вывода средств укажите сумму и адрес TON Wallet вручную. Форма будет позже.');
    }

    @Command('topup')
    async handleTopup(@Ctx() ctx: any) {
        const userId = ctx.from.id;
        const amount = 10; // временно фиксированная сумма

        const invoice = await this.paymentsService.createInvoice({
            amount,
            currency: 'USDT',
            description: `Пополнение баланса пользователем ${userId}`,
            callbackUrl: `${process.env.BACKEND_URL}/payments/webhook`,
        }, userId);

        await ctx.reply(
            `💰 <b>Пополнение на ${amount} USDT</b>\n\n` +
            `Нажмите кнопку ниже, чтобы перейти к оплате:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Перейти к оплате', url: invoice.link }],
                    ],
                },
            }
        );
    }

    private async getUserPhoto(userId: number): Promise<string | null> {
        try {
            const photos = await this.bot.telegram.getUserProfilePhotos(userId, 0, 1);
            if (photos.total_count > 0) {
                const fileId = photos.photos[0][0].file_id;
                const file = await this.bot.telegram.getFile(fileId);
                return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            }
        } catch (error) {
            this.logger.warn(`⚠️ Не удалось получить фото для ${userId}: ${error.message}`);
        }
        return null;
    }

    @Command('finance')
    @Action('finance_menu')
    async showFinanceMenu(@Ctx() ctx: any) {
        const balance = await this.userService.getBalanceByTelegramId(ctx.from.id.toString());

        await ctx.reply(
            `💰 Ваш текущий баланс: <b>${balance} USDT</b>\nВыберите действие:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📥 Пополнить', callback_data: 'finance_topup' }],
                        [{ text: '📤 Вывести', callback_data: 'finance_withdraw' }],
                        [{ text: '🔙 Назад', callback_data: 'main_menu' }],
                    ],
                },
            }
        );
    }


    @Action('finance_topup')
    async handleFinanceTopup(@Ctx() ctx: any) {
        await ctx.reply(
            '💰 Выберите сумму пополнения USDT:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '3 USDT', callback_data: 'topup_amount_3' },
                            { text: '5 USDT', callback_data: 'topup_amount_5' },
                            { text: '10 USDT', callback_data: 'topup_amount_10' },
                        ],
                        [
                            { text: '15 USDT', callback_data: 'topup_amount_15' },
                            { text: '25 USDT', callback_data: 'topup_amount_25' },
                        ],
                        [
                            { text: '🔙 Назад', callback_data: 'finance_menu' },
                        ],
                    ],
                },
            }
        );
    }

    @Action(/topup_amount_(\d+)/)
    async handleTopupAmount(@Ctx() ctx: any) {
        const telegramId = ctx.from.id;
        const amount = parseInt(ctx.match[1]);

        if (isNaN(amount) || amount < 3) {
            await ctx.reply('⚠️ Сумма должна быть не менее 3 USDT.');
            return;
        }

        this.userTopupSelections.set(telegramId, amount);

        await ctx.reply(
            `Вы выбрали пополнение на <b>${amount} USDT</b>. Подтвердите действие:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Подтвердить', callback_data: 'topup_confirm' },
                            { text: '🔙 Назад', callback_data: 'finance_topup' },
                        ],
                    ],
                },
            }
        );
    }


    @Action('topup_confirm')
    async handleTopupConfirm(@Ctx() ctx: any) {
        const telegramId = ctx.from.id;
        const amount = this.userTopupSelections.get(telegramId);

        if (!amount || amount < 3) {
            await ctx.reply('⚠️ Сумма не выбрана или слишком мала. Начните заново.');
            return;
        }

        try {
            const invoice = await this.paymentsService.createInvoice({
                amount,
                currency: 'USDT',
                description: `Пополнение баланса пользователем ${telegramId}`,
                callbackUrl: `${process.env.BACKEND_URL}/payments/webhook`,
            }, telegramId);

            await ctx.reply(
                `💰 <b>Пополнение на ${amount} USDT</b>\n\n` +
                `Нажмите кнопку ниже, чтобы перейти к оплате:`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Перейти к оплате', url: invoice.link }],
                        ],
                    },
                }
            );
        } catch (error) {
            this.logger.error(`Ошибка при создании инвойса: ${error.message}`);
            await ctx.reply('❌ Не удалось создать счёт. Попробуйте позже.');
        }
    }



    // Вывод
        @Action('finance_withdraw')
        async handleFinanceWithdraw(@Ctx() ctx: any) {
            await this.handleWithdraw(ctx); // вызываем уже существующий метод
        }


    @Action('back_to_start')
    async handleBackToStart(@Ctx() ctx: any) {
        await this.handleStart(ctx);
    }
}
