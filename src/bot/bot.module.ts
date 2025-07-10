import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import {TelegrafModule} from "nestjs-telegraf";
import {UserModule} from "../user/user.module";
import {PaymentsService} from "../payment/payments.service";
import {PaymentsModule} from "../payment/payment.module";
import {TableModule} from "../table/table.module";

@Module({
    imports: [
        TelegrafModule,// <--- ДОБАВЬ ЭТО!
        UserModule,
        PaymentsModule,
    ],
    providers: [BotService, UserService, PrismaService, PaymentsService],
    exports: [BotService],
})
export class BotModule {}
