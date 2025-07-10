import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { TransferDto } from './dto/transfer.dto';
import { CreateChequeDto } from './dto/create-cheque.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { UserService } from '../user/user.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        @InjectBot() private readonly bot: Telegraf,
        @Inject('ROCKET_PAY') private readonly rocketPay: any,
    ) {
        this.logger.log('PaymentsService initialized');
    }

    async createInvoice(dto: CreateInvoiceDto, telegramId: number) {
        const { amount, currency, description, callbackUrl } = dto;

        this.logger.log(`Creating invoice: ${amount} ${currency} for telegramId: ${telegramId}`);
        const validAmounts = [3, 5, 10, 15, 25];
        if (currency === 'USDT' && !validAmounts.includes(amount)) {
            throw new Error('Недопустимая сумма. Выберите 3, 5, 10, 15 или 25 USDT.');
        }

        const invoice = await this.rocketPay.invoice.create({
            amount,
            currency,
            description,
            callback_url: callbackUrl,
        });

        if (!invoice?.id || !invoice?.link) {
            this.logger.error('❌ Не удалось получить ID или payment_url инвойса от RocketPay');
            throw new Error('Invoice creation failed: missing ID or payment_url');
        }

        const user = await this.userService.getUser(telegramId.toString());
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        await this.prisma.invoice.create({
            data: {
                id: invoice.id,
                userId: user.id,
                amount,
                currency,
                status: 'pending',
                createdAt: new Date(),
                link: invoice.link,
                paymentId: invoice.payment_id || 0,
            },
        });

        this.logger.log(`Invoice created: ${invoice.id}`);
        return { id: invoice.id, link: invoice.link };
    }

    async getInvoice(invoiceId: string) {
        this.logger.log(`Fetching invoice: ${invoiceId}`);
        return this.rocketPay.invoice.get(invoiceId);
    }

    async getLastUserInvoices(telegramId: string) {
        this.logger.log(`Fetching last 5 invoices for telegramId: ${telegramId}`);
        const user = await this.userService.getUser(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const invoices = await this.prisma.invoice.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                createdAt: true,
                link: true,
                paidAt: true,
            },
        });

        this.logger.log(`Found ${invoices.length} invoices for userId: ${user.id}`);
        return invoices;
    }

    async getPendingUserInvoices(telegramId: string) {
        this.logger.log(`Fetching pending invoices for telegramId: ${telegramId}`);
        const user = await this.userService.getUser(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const invoices = await this.prisma.invoice.findMany({
            where: { userId: user.id, status: 'pending' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                createdAt: true,
                link: true,
                paidAt: true,
            },
        });

        this.logger.log(`Found ${invoices.length} pending invoices for userId: ${user.id}`);
        return invoices;
    }

    async transfer(dto: TransferDto) {
        const { telegramId, amount, comment } = dto;
        this.logger.log(`Transferring ${amount} TON to user ${telegramId}`);
        return this.rocketPay.transfer.create({
            telegram_id: telegramId,
            amount,
            comment,
        });
    }

    async createCheque(dto: CreateChequeDto) {
        const { amount, count, description } = dto;
        this.logger.log(`Creating cheque: ${amount} for ${count} users`);
        return this.rocketPay.cheque.create({
            amount,
            count,
            description,
        });
    }

    async handleWebhook(payload: any) {
        this.logger.log('Webhook received:', JSON.stringify(payload));

        if (payload.event === 'invoice.paid') {
            const invoice = payload.data;

            if (invoice.status !== 'paid') {
                this.logger.warn(`Invoice ${invoice.id} has unexpected status: ${invoice.status}`);
                return { ok: false, reason: 'Invalid invoice status' };
            }

            this.logger.log(`✅ Invoice ${invoice.id} confirmed paid by user ${invoice.payer.telegram_id}`);

            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: 'paid', paidAt: new Date() },
            });

            await this.userService.increaseBalance(invoice.payer.telegram_id, Number(invoice.amount));

            try {
                await this.bot.telegram.sendMessage(
                    invoice.payer.telegram_id,
                    `🎉 Ваш счёт #${invoice.id} на сумму ${invoice.amount} USDT успешно оплачен! Спасибо!`
                );
            } catch (err) {
                this.logger.warn(`Не удалось отправить сообщение пользователю ${invoice.payer.telegram_id}: ${err.message}`);
            }

            return { ok: true };
        }

        this.logger.log('📌 Unhandled webhook event:', payload.event);
        return { ok: true, skipped: true };
    }



    async notifyUser(telegramId: string, invoiceId: string, paymentUrl: string, amount: number) {
        this.logger.log(`Sending notification for telegramId: ${telegramId}, invoiceId: ${invoiceId}, url: ${paymentUrl}`);
        try {
            await this.bot.telegram.sendMessage(
                Number(telegramId), // <= явно привести к числу
                `💸 Ваш инвойс #${invoiceId} USDT создан!\n\nНажмите кнопку ниже, чтобы оплатить:`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '💳 Оплатить',
                                    url: paymentUrl, // <= должен быть валидный URL
                                },
                            ],
                        ],
                    },
                }
            );
        } catch (error) {
            this.logger.error(`Ошибка отправки уведомления: ${error.message}`);
            throw new Error('Не удалось отправить уведомление в Telegram');
        }
    }

}
