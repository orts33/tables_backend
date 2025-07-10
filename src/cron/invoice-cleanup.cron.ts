import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceCleanupCron {
    private readonly logger = new Logger(InvoiceCleanupCron.name);

    constructor(private readonly prisma: PrismaService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
    async handleCleanup() {
        try {
            this.logger.log('Starting cleanup of pending invoices older than 3 days');

            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const deleted = await this.prisma.invoice.deleteMany({
                where: {
                    status: 'pending',
                    createdAt: {
                        lt: threeDaysAgo,
                    },
                },
            });

            this.logger.log(`Deleted ${deleted.count} pending invoices older than 3 days`);
        } catch (error) {
            this.logger.error(`Failed to clean up invoices: ${error.message}`, error.stack);
        }
    }
}
