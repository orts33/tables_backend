// src/admin/withdrawal.controller.ts

import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/admin/withdrawals')
export class WithdrawalController {
    constructor(private prisma: PrismaService) {}

    @Get()
    async getAll() {
        return this.prisma.withdrawalRequest.findMany({
            include: {
                user: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    @Patch(':id')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'approved' | 'rejected' },
    ) {
        return this.prisma.withdrawalRequest.update({
            where: { id: +id },
            data: { status: body.status },
        });
    }
}
