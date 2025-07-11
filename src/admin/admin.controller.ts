import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
    NotFoundException,
    Logger,
    Query, BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Prisma } from '@prisma/client';
import {ConfigService} from "@nestjs/config";
import { InjectBot } from 'nestjs-telegraf';
import {Telegraf} from "telegraf";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";

@ApiTags('Admin')         // <-- Использование после импорта
@ApiBearerAuth()          // <-- Использование после импорта
@UseGuards(JwtAuthGuard)
@Controller('api/admin')
export class AdminController {
    private readonly logger = new Logger(AdminController.name);

    constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService,  @InjectBot() private readonly bot: Telegraf
    ) {}

    @Post('users')
    async createUser(@Body() data: { telegramId: string; username?: string; firstName?: string; lastName?: string; photoUrl?: string; balance?: number; level?: number; xp?: number }) {
        this.logger.log(`Создание пользователя с telegramId: ${data.telegramId}`);
        try {
            return await this.prisma.user.create({
                data: {
                    telegramId: data.telegramId,
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    photoUrl: data.photoUrl,
                    balance: data.balance || 0,
                    level: data.level || 1,
                    xp: data.xp || 0,
                },
            });
        } catch (error) {
            this.logger.error(`Ошибка создания пользователя: ${error.message}`);
            throw error;
        }
    }

    @Get('users')
    async getUsers(@Query('search') search?: string, @Query('searchBy') searchBy?: string) {
        const fields = (searchBy?.split(",") || []) as (keyof Prisma.UserWhereInput)[];

        const where: Prisma.UserWhereInput = search && fields.length
            ? {
                OR: fields.map((field) => ({
                    [field]: { contains: search },
                })),
            }
            : {};

        const users = await this.prisma.user.findMany({
            where,
            include: {
                referrals: true,
                referred: true,
            },
        });

        return {
            data: users,
            total: users.length, // лучше использовать count отдельно при больших данных
        };
    }

    @Get('users/:id')
    async getUser(@Param('id') id: string) {
        this.logger.log(`Получение пользователя с id: ${id}`);
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: parseInt(id) },
                include: {
                    referrals: true, // Соответствует @relation("Referrer")
                    referred: true,  // Соответствует @relation("Referred")
                    // invoices: true,
                },
            });
            if (!user) {
                throw new NotFoundException(`Пользователь с id ${id} не найден`);
            }
            return user;
        } catch (error) {
            this.logger.error(`Ошибка получения пользователя: ${error.message}`);
            throw error;
        }
    }

    @Put('users/:id')
    async updateUser(@Param('id') id: string, @Body() data: { balance?: number; level?: number; xp?: number }) {
        this.logger.log(`Обновление пользователя с id: ${id}`);
        try {
            return await this.prisma.user.update({
                where: { id: parseInt(id) },
                data,
            });
        } catch (error) {
            this.logger.error(`Ошибка обновления пользователя: ${error.message}`);
            throw error;
        }
    }

    @Delete('users/:id')
    async deleteUser(@Param('id') id: string) {
        this.logger.log(`Удаление пользователя с id: ${id}`);
        try {
            return await this.prisma.user.delete({
                where: { id: parseInt(id) },
            });
        } catch (error) {
            this.logger.error(`Ошибка удаления пользователя: ${error.message}`);
            throw error;
        }
    }

    @Get('referrals')
    async getReferrals() {
        this.logger.log('Получение списка рефералов');
        try {
            return await this.prisma.referral.findMany({
                include: { referrer: true, referred: true },
            });
        } catch (error) {
            this.logger.error(`Ошибка получения рефералов: ${error.message}`);
            throw error;
        }
    }

    @Get('invoices')
    async getInvoices() {
        this.logger.log('Получение списка счетов');
        try {
            return await this.prisma.invoice.findMany({
                include: { user: true },
            });
        } catch (error) {
            this.logger.error(`Ошибка получения счетов: ${error.message}`);
            throw error;
        }
    }

    @Put('invoices/:id')
    async updateInvoice(@Param('id') id: string, @Body() data: { status: string }) {
        this.logger.log(`Обновление счета с id: ${id}`);
        try {
            return await this.prisma.invoice.update({
                where: { id },
                data: { status, paidAt: data.status === 'paid' ? new Date() : null },
            });
        } catch (error) {
            this.logger.error(`Ошибка обновления счета: ${error.message}`);
            throw error;
        }
    }

    @Get('tables')
    async getTables() {
        this.logger.log('Получение списка столов');
        try {
            const tables = await this.prisma.table.findMany({
                include: {
                    tableUsers: {
                        include: { user: true },
                    },
                    tablePrizes: true,
                },
            });

            return {
                data: tables,
                total: tables.length,
            };
        } catch (error) {
            this.logger.error(`Ошибка получения столов: ${error.message}`);
            throw error;
        }
    }

    @Post('tables')
    async createTable(@Body() data: {
        type: string;
        entryFee: number;
        prizeFund: number;
        status: string;
        inviteLink: string;
    }) {
        this.logger.log(`Создание нового стола`);



        const randomString = Math.random().toString(36).substring(2, 15);
        const botName = this.configService.get('TELEGRAM_BOT_NAME');
        const inviteLink = `https://t.me/${botName}?start=table_${randomString}`;

        try {
            const table = await this.prisma.table.create({
                data: {
                    type: data.type as any,
                    entryFee: data.entryFee,
                    prizeFund: 10 * data.entryFee,
                    status: data.status as any,
                    inviteLink: inviteLink,
                },
            });

            return table;
        } catch (error) {
            this.logger.error(`Ошибка создания стола: ${error.message}`);
            throw error;
        }
    }


    @Get('table-users')
    async getTableUsers(@Query('tableId') tableId: string) {
        this.logger.log(`Получение игроков для стола: ${tableId}`);
        try {
            const users = await this.prisma.tableUser.findMany({
                where: {
                    tableId: parseInt(tableId),
                },
                include: {
                    user: true,
                },
            });

            return users;
        } catch (error) {
            this.logger.error(`Ошибка получения игроков стола: ${error.message}`);
            throw error;
        }
    }

    @Delete('tables/:id')
    async deleteTable(@Param('id') id: string) {
        const tableId = parseInt(id);
        this.logger.log(`Удаление стола с id: ${tableId}`);

        try {
            // Удалить игроков стола
            await this.prisma.tableUser.deleteMany({
                where: { tableId },
            });

            // Удалить призы стола
            await this.prisma.tablePrize.deleteMany({
                where: { tableId },
            });

            // Удалить сам стол
            const deleted = await this.prisma.table.delete({
                where: { id: tableId },
            });

            return deleted;
        } catch (error) {
            this.logger.error(`Ошибка удаления стола: ${error.message}`);
            throw error;
        }
    }



    @Post('table-users')
    async assignUserToTable(@Body() data: { tableId: number; userId: number; isFirstBet?: boolean }) {
        this.logger.log(`Распределение игрока userId=${data.userId} на стол tableId=${data.tableId}`);

        try {
            const existing = await this.prisma.tableUser.findFirst({
                where: { tableId: data.tableId, userId: data.userId },
            });

            if (existing) {
                return await this.prisma.tableUser.update({
                    where: { id: existing.id },
                    data: {
                        isFirstBet: data.isFirstBet ?? existing.isFirstBet,
                    },
                });
            }

            return await this.prisma.tableUser.create({
                data: {
                    tableId: data.tableId,
                    userId: data.userId,
                    isFirstBet: data.isFirstBet ?? false,
                },
            });
        } catch (error) {
            this.logger.error(`Ошибка при распределении игрока: ${error.message}`);
            throw error;
        }
    }


    @Delete('table-users/:id')
    async removeTableUser(@Param('id') id: string) {
        this.logger.log(`Удаление игрока из стола: tableUserId=${id}`);
        try {
            return await this.prisma.tableUser.delete({
                where: { id: parseInt(id) },
            });
        } catch (error) {
            this.logger.error(`Ошибка удаления игрока из стола: ${error.message}`);
            throw error;
        }
    }


    // GET: /api/admin/withdrawals
    @Get('withdrawals')
    async getWithdrawals() {
        return this.prisma.withdrawalRequest.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // PUT: /api/admin/withdrawals/:id
    @Put('withdrawals/:id')
    async updateWithdrawal(
        @Param('id') id: string,
        @Body() data: { status: 'approved' | 'rejected' }
    ) {
        return this.prisma.withdrawalRequest.update({
            where: { id: Number(id) },
            data,
        });
    }


    @Post('notify-user/:id')
    async notifyUserById(
        @Param('id') id: string,
        @Body() body: { message: string }
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: Number(id) },
        });

        if (!user || !user.telegramId) {
            throw new NotFoundException('Пользователь не найден или не имеет Telegram ID');
        }

        try {
            await this.bot.telegram.sendMessage(user.telegramId, body.message);
            return { success: true };
        } catch (error) {
            this.logger.error(`Ошибка отправки сообщения пользователю ${user.id}: ${error.message}`);
            throw new BadRequestException('Не удалось отправить сообщение');
        }
    }

}

