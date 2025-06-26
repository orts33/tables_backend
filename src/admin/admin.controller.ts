import { Controller, Get, Param, Put, Delete, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('users')
    async getUsers() {
        return this.prisma.user.findMany({
            include: { referrals: true, referred: true, invoices: true },
        });
    }

    @Get('users/:id')
    async getUser(@Param('id') id: string) {
        return this.prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { referrals: true, referred: true, invoices: true },
        });
    }

    @Put('users/:id')
    async updateUser(@Param('id') id: string, @Body() data: { balance?: number; level?: number; xp?: number }) {
        return this.prisma.user.update({
            where: { id: parseInt(id) },
            data,
        });
    }

    @Delete('users/:id')
    async deleteUser(@Param('id') id: string) {
        return this.prisma.user.delete({
            where: { id: parseInt(id) },
        });
    }

    @Get('referrals')
    async getReferrals() {
        return this.prisma.referral.findMany({
            include: { referrer: true, referred: true },
        });
    }

    @Get('invoices')
    async getInvoices() {
        return this.prisma.invoice.findMany({
            include: { user: true },
        });
    }

    @Put('invoices/:id')
    async updateInvoice(@Param('id') id: string, @Body() data: { status: string }) {
        return this.prisma.invoice.update({
            where: { id },
            data: { status, paidAt: data.status === 'paid' ? new Date() : null },
        });
    }
}
