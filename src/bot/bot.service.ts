import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {Start, Update, InjectBot, Ctx, Action, Command, On} from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { UserService } from '../user/user.service';
import { PaymentsService } from '../payment/payments.service';
import * as process from 'node:process';
import {PrismaService} from "../prisma/prisma.service";

@Update()
@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);

    constructor(
        private readonly userService: UserService,
        private readonly paymentsService: PaymentsService,
        private readonly prisma: PrismaService,
        @InjectBot() private readonly bot: Telegraf,
    ) {}

    private userTopupSelections: Map<number, number> = new Map();
    private navigationStacks: Map<number, string[]> = new Map();

    async sendMessage(chatId: string, text: string, options?: any) {
        try {
            await this.bot.telegram.sendMessage(chatId, text, options);
        } catch (error) {
            this.logger.error(`Ошибка отправки сообщения: ${error.message}`);
            throw error;
        }
    }

    private pushToStack(userId: number, screen: string) {
        const stack = this.navigationStacks.get(userId) || [];
        if (stack[stack.length - 1] !== screen) {
            stack.push(screen);
        }
        this.navigationStacks.set(userId, stack);
    }

    private popFromStack(userId: number): string | null {
        const stack = this.navigationStacks.get(userId);
        if (stack && stack.length > 1) {
            stack.pop();
            return stack[stack.length - 1];
        }
        return null;
    }

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

            this.navigationStacks.set(id, ['start']);

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
                                    text: '🔗 Пригласительная ссылка',
                                    callback_data: `copy_ref_${telegramId}`,
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

    @Action('navigate_back')
    async handleNavigateBack(@Ctx() ctx: any) {
        const userId = ctx.from.id;
        const prevScreen = this.popFromStack(userId);

        if (!prevScreen) return this.handleStart(ctx);

        switch (prevScreen) {
            case 'finance_menu':
                return this.showFinanceMenu(ctx);
            case 'finance_topup':
                return this.handleFinanceTopup(ctx);
            case 'start':
                return this.handleStart(ctx);
            default:
                return this.handleStart(ctx);
        }
    }

    @Command('finance')
    @Action('finance_menu')
    async showFinanceMenu(@Ctx() ctx: any) {
        this.pushToStack(ctx.from.id, 'finance_menu');

        const balance = await this.userService.getBalanceByTelegramId(ctx.from.id.toString());

        await ctx.reply(
            `💰 Ваш текущий баланс: <b>${balance} USDT</b>\nВыберите действие:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📥 Пополнить', callback_data: 'finance_topup' }],
                        [{ text: '📤 Вывести', callback_data: 'finance_withdraw' }],
                        [{ text: '🔙 Назад', callback_data: 'navigate_back' }],
                    ],
                },
            }
        );
    }

    @Action('finance_topup')
    async handleFinanceTopup(@Ctx() ctx: any) {
        this.pushToStack(ctx.from.id, 'finance_topup');

        await ctx.reply('💰 Выберите сумму пополнения USDT:', {
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
                        { text: '🔙 Назад', callback_data: 'navigate_back' },
                    ],
                ],
            },
        });
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
                            { text: '🔙 Назад', callback_data: 'navigate_back' },
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

            await ctx.replyWithHTML(
                `💰 <b>Пополнение на ${amount} USDT</b>\n\n` +
                `Нажмите кнопку ниже, чтобы перейти к оплате:\n\n` +
                `Если у вас ещё нет USDT — сначала купите его на крипто-кошелёк через надёжный сервис.`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Перейти к оплате', url: invoice.link }],
                            [{ text: '💱 Как купить USDT за рубли?', callback_data: 'main_buy_usdt' }],
                            [{ text: '🔙 Назад', callback_data: 'finance_menu' }],
                        ],
                    },
                }
            );
        } catch (error) {
            this.logger.error(`Ошибка при создании инвойса: ${error.message}`);
            await ctx.reply('❌ Не удалось создать счёт. Попробуйте позже.');
        }
    }

    @Action('main_buy_usdt')
    async handleMainBuyUsdt(@Ctx() ctx: any) {
        await ctx.replyWithHTML(
            `💱 <b>Как купить USDT за рубли (если у вас ещё нет)</b>\n\n` +
            `USDT — это стабильная криптовалюта, которая всегда равна 1 доллару США.\n` +
            `Она нужна для пополнения баланса в игре.\n\n` +
            `🪙 <b>Что нужно сделать:</b>\n` +
            `1. Создайте крипто-кошелёк (например, <b>Trust Wallet</b>, <b>Binance</b> или <b>Tonkeeper</b>)\n` +
            `2. Получите <b>адрес в сети TRC20</b> — он понадобится для перевода\n` +
            `3. Купите USDT через P2P (например, Bitpapa)\n\n` +
            `🔸 Оплатить можно через банковские карты РФ, ЮMoney, СБП и другие\n` +
            `🔗 <a href="https://bitpapa.com/ru/buy-usdt">Перейти на Bitpapa</a>\n\n` +
            `❗ После покупки переведите USDT на свой крипто-кошелёк и используйте его в приложении`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Назад', callback_data: 'finance_menu' }],
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


    @Command('withdraw')
    @Action('finance_withdraw')
    async handleWithdraw(@Ctx() ctx: any) {
        const telegramId = ctx.from.id.toString();
        const user = await this.userService.findByTelegramId(telegramId);

        if (!user || user.balance.toNumber() < 3) {
            await ctx.reply('❌ Для вывода у вас должен быть минимум 3 USDT.');
        }

        else {
            await ctx.reply('Введите сумму и адрес в формате: `5 USDT TRC20-адрес`', {
                parse_mode: 'Markdown',
            });
        }


        this.pushToStack(ctx.from.id, 'awaiting_withdraw_data');
    }

    @On('text')
    async handleText(@Ctx() ctx: any) {
        const stack = this.navigationStacks.get(ctx.from.id);
        const last = stack?.[stack.length - 1];

        if (last === 'awaiting_withdraw_data') {
            const [amountStr, ...rest] = ctx.message.text.split(' ');
            const address = rest.join(' ');
            const amount = parseFloat(amountStr);

            if (!amount || !address) {
                await ctx.reply('⚠️ Неверный формат. Попробуйте ещё раз: `5 TRC20-адрес`');
                return;
            }

            const user = await this.userService.findByTelegramId(ctx.from.id.toString());

            if (!user || +user.balance < amount) {
                await ctx.reply('❌ Недостаточно средств.');
                return;
            }

            // 🔥 Новая проверка: сколько заявок уже создано
            const pendingCount = await this.prisma.withdrawalRequest.count({
                where: {
                    userId: user.id,
                    status: { in: ['pending', 'processing'] }, // Или null, если статус необязательный
                },
            });

            if (pendingCount >= 5) {
                await ctx.reply('🚫 У вас уже есть 5 необработанных заявок. Подождите, пока админ их рассмотрит.');
                return;
            }

            // ✅ Создаём заявку
            const withdrawal = await this.prisma.withdrawalRequest.create({
                data: {
                    userId: user.id,
                    amount,
                    address,
                },
            });


            // Уведомляем администратора
            const adminId = process.env.ADMIN_TELEGRAM_ID;

            if (adminId) {
                try {
                    await this.bot.telegram.sendMessage(
                        adminId,
                        `📤 <b>Новая заявка на вывод средств</b>\n\n` +
                        `👤 Пользователь: <code>${user.firstName || ''} ${user.lastName || ''} (${user.telegramId})</code>\n` +
                        `💸 Сумма: <b>${amount} USDT</b>\n` +
                        `🏦 Адрес: <code>${address}</code>\n\n` +
                        `🆔 ID заявки: ${withdrawal.id}`,
                        { parse_mode: 'HTML' }
                    );
                } catch (error) {
                    this.logger.warn(`❗ Не удалось уведомить админа: ${error.message}`);
                }
            }

            this.popFromStack(ctx.from.id);
            await ctx.reply('✅ Заявка на вывод создана. Ожидайте подтверждения от администрации.');
        }
    }



}
