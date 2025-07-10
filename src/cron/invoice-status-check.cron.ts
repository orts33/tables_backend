import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {PrismaService} from "../prisma/prisma.service";
import {PaymentsService} from "../payment/payments.service";
import {UserService} from "../user/user.service";

@Injectable()
export class InvoiceStatusCheckCron {
    private readonly logger = new Logger(InvoiceStatusCheckCron.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentsService: PaymentsService,
        private readonly userService: UserService,
        @InjectBot() private readonly bot: Telegraf,
    ) {}

    @Cron(CronExpression.EVERY_2_HOURS, { timeZone: 'UTC' })
    async handleStatusCheck() {
        try {
            this.logger.log('Checking status of pending invoices');

            // Получаем все pending инвойсы
            const pendingInvoices = await this.prisma.invoice.findMany({
                where: { status: {
                     in: ['pending', 'active']
                    } },
                select: { id: true, userId: true },
            });

            this.logger.log(`Found ${pendingInvoices.length} pending invoices`);

            // Обрабатываем батчами по 5 (учитываем rate limit 5 req/sec)
            const batchSize = 5;
            for (let i = 0; i < pendingInvoices.length; i += batchSize) {
                const batch = pendingInvoices.slice(i, i + batchSize);

                const promises = batch.map(async (invoice) => {
                    try {
                        const response = await this.paymentsService.getInvoice(invoice.id);
                        const { status, paidAt, amount, payer } = response;

                        this.logger.log(`Invoice ${invoice.id} status: ${status}`);

                        // Обновляем БД
                        await this.prisma.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                status,
                                paidAt: paidAt ? new Date(paidAt) : null,
                            },
                        });

                        // Если оплачен, увеличиваем баланс и уведомляем
                        if (status === 'paid' && payer?.telegram_id) {
                            await this.userService.increaseBalance(payer.telegram_id, amount);
                            try {
                                await this.bot.telegram.sendMessage(
                                    payer.telegram_id,
                                    `🎉 Ваш счёт #${invoice.id} на сумму ${amount} ${response.currency} успешно оплачен! Спасибо!`,
                                );
                            } catch (err) {
                                this.logger.warn(
                                    `Failed to notify user ${payer.telegram_id} for invoice ${invoice.id}: ${err.message}`,
                                );
                            }
                        }
                    } catch (error) {
                        this.logger.error(`Failed to check invoice ${invoice.id}: ${error.message}`);
                    }
                });

                await Promise.all(promises);

                // Задержка 1 сек между батчами
                if (i + batchSize < pendingInvoices.length) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            this.logger.log('Finished checking invoice statuses');
        } catch (error) {
            this.logger.error(`Failed to check invoice statuses: ${error.message}`, error.stack);
        }
    }
}
