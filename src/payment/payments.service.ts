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
    ) {}

    async createInvoice(dto: CreateInvoiceDto, telegramId: number) {
        const { amount, currency, description, callbackUrl } = dto;

        this.logger.log(`Creating invoice: ${amount} ${currency}`);

        const invoice = await this.rocketPay.invoice.create({
            amount,
            currency,
            description,
            callback_url: callbackUrl,
        });

        if (!invoice?.id) {
            this.logger.error('❌ Не удалось получить ID инвойса от RocketPay');
            throw new Error('Invoice creation failed: missing ID');
        }

        // Получаем user.id по telegramId
        const user = await this.userService.getUser(telegramId.toString());

        await this.prisma.invoice.create({
            data: {
                id: invoice.id,
                userId: user.id,
                amount,
                currency,
                status: 'pending',
                createdAt: new Date(),
            },
        });

        return invoice;
    }

    async getInvoice(invoiceId: string) {
        this.logger.log(`Fetching invoice: ${invoiceId}`);
        return this.rocketPay.invoice.get(invoiceId);
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

            // Проверка статуса
            if (invoice.status !== 'paid') {
                this.logger.warn(`Invoice ${invoice.id} has unexpected status: ${invoice.status}`);
                return { ok: false, reason: 'Invalid invoice status' };
            }

            this.logger.log(`✅ Invoice ${invoice.id} confirmed paid by user ${invoice.payer.telegram_id}`);

            // Обновляем в БД
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: 'paid', paidAt: new Date() },
            });


            await this.userService.increaseBalance(invoice.payer.telegram_id, Number(invoice.amount));

            // Уведомляем пользователя
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

}
