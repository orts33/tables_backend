import { Module } from '@nestjs/common';
import { TableModule } from './table/table.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClanModule } from './clan/clan.module';
import { UserModule } from './user/user.module';
import {ConfigModule} from "@nestjs/config";
import { LevelModule } from './level/level.module';
// import { PaymentsModule } from './payment/payment.module';
import { BotModule } from './bot/bot.module';
import {TelegrafModule} from "nestjs-telegraf";
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true, // Делаем ConfigModule глобальным
        envFilePath: '.env',
      }),
      TelegrafModule.forRoot({
          token: process.env.TELEGRAM_BOT_TOKEN,
      }),
      TableModule, PrismaModule, ClanModule, UserModule, LevelModule, BotModule, AuthModule, AdminModule],
})
export class AppModule {}
