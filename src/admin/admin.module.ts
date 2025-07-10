import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';
import {WithdrawalController} from "./withdrawal.controller";

@Module({
    controllers: [AdminController, WithdrawalController],
    providers: [PrismaService],
})
export class AdminModule {}
