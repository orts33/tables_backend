import { Module } from '@nestjs/common';
import { TableModule } from './table/table.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClanModule } from './clan/clan.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { LevelModule } from './level/level.module';
import { PaymentsModule } from './payment/payment.module'; // Раскомментировано
import { BotModule } from './bot/bot.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { Bootstrap } from './bootstrap';
import { InvoiceCleanupCron } from './cron/invoice-cleanup.cron';
import { InvoiceStatusCheckCron } from './cron/invoice-status-check.cron'; // Исправленный путь
import { ScheduleModule } from '@nestjs/schedule';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

@Module({
    providers: [
        Bootstrap,
        InvoiceCleanupCron,
        InvoiceStatusCheckCron,
    ],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        ScheduleModule.forRoot(),
        TelegrafModule.forRoot({
            token: process.env.TELEGRAM_BOT_TOKEN,
        }),
        TableModule,
        PrismaModule,
        ClanModule,
        UserModule,
        LevelModule,
        PaymentsModule, // Добавлен
        BotModule,
        AuthModule,
        AdminModule,
        AdminAuthModule,
    ],
})
export class AppModule {}
