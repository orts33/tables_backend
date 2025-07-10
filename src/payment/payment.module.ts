// payments.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { PrismaModule } from '../prisma/prisma.module';
import {UserModule} from "../user/user.module";
import {BotModule} from "../bot/bot.module";

@Module({
    imports: [ConfigModule, PrismaModule, UserModule],
    controllers: [PaymentsController],
    providers: [
        PaymentsService,
        {
            provide: 'ROCKET_PAY',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const instance = axios.create({
                    baseURL: config.get('XROCKET_API_URL') || 'https://pay.xrocket.tg',
                    headers: {
                        'Rocket-Pay-Key': config.get('XROCKET_API_KEY'),
                        'Content-Type': 'application/json',
                    },
                    timeout: 12000, // увеличили таймаут для надёжности
                });

                axiosRetry(instance, {
                    retries: 3,
                    retryDelay: axiosRetry.exponentialDelay,
                    retryCondition: (error) =>
                        axiosRetry.isNetworkError(error) || error.response?.status >= 500,
                });

                return {
                    invoice: {
                        create: (data: any) => instance.post('/tg-invoices', data).then(res => res.data.data),
                        get: (id: string) => instance.get(`/tg-invoices/${id}`).then(res => res.data.data),
                    },
                    transfer: {
                        create: (data: any) => instance.post('/transfer', data).then(res => res.data),
                    },
                    cheque: {
                        create: (data: any) => instance.post('/cheque', data).then(res => res.data),
                    },
                };
            },
        },
    ],
    exports: ['ROCKET_PAY', PaymentsService], // 👈 обязательно экспортируем
})
export class PaymentsModule {}
