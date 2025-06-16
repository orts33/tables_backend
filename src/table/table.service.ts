// table.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TableStatus } from '@prisma/client';
import { CreateTableDto, JoinTableDto, RegisterUserDto } from './table.dto';

@Injectable()
export class TableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    async create(data: CreateTableDto) {
        const { prizeFund } = data;
        if (prizeFund < 0) {
            throw new BadRequestException('Некорректный призовой фонд');
        }

        const randomString = Math.random().toString(36).substring(2, 15);
        const botName = this.configService.get('TELEGRAM_BOT_NAME');
        const inviteLink = `https://t.me/${botName}?start=table_${randomString}`;

        return this.prisma.table.create({
            data: {
                prizeFund,
                inviteLink,
            },
            include: {
                tableUsers: { include: { user: true } },
            },
        });
    }

    async getTables() {
        return this.prisma.table.findMany({
            include: {
                tableUsers: { include: { user: true } },
            },
        });
    }

    async getTableByInviteLink(inviteLink: string) {
        const table = await this.prisma.table.findUnique({
            where: { inviteLink },
            include: { tableUsers: { include: { user: true } } },
        });

        if (!table) {
            throw new BadRequestException('Стол не найден');
        }

        return table.status === TableStatus.OPEN ? table : null;
    }

    async joinTable(data: JoinTableDto) {
        const { tableId, telegramId } = data;

        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            throw new BadRequestException('Пользователь не найден');
        }

        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: true },
        });

        if (!table || table.status !== TableStatus.OPEN) {
            throw new BadRequestException('Стол не найден или не открыт');
        }

        if (table.tableUsers.length >= 15) {
            throw new BadRequestException('Стол полон');
        }

        if (table.tableUsers.some((tu) => tu.userId === user.id)) {
            throw new BadRequestException('Пользователь уже присоединился к этому столу');
        }

        const updatedTable = await this.prisma.table.update({
            where: { id: tableId },
            data: {
                tableUsers: { create: { userId: user.id } },
            },
            include: {
                tableUsers: { include: { user: true } },
            },
        });

        if (updatedTable.tableUsers.length === 15) {
            await this.splitAndFinishTable(tableId);
        }

        return updatedTable;
    }

    async finishTable(tableId: number, winnerId: number) {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: true },
        });

        if (!table || table.status === TableStatus.FINISHED) {
            throw new BadRequestException('Стол не найден или уже завершен');
        }

        await this.prisma.table.update({
            where: { id: tableId },
            data: { status: TableStatus.FINISHED },
        });

        const winner = table.tableUsers.find((tu) => tu.userId === winnerId);
        if (winner) {
            await this.prisma.user.update({
                where: { id: winner.userId },
                data: { wonTables: { increment: 1 } },
            });
        } else {
            throw new BadRequestException('Победитель не является участником стола');
        }

        const userIds = table.tableUsers.map((tu) => tu.userId);
        await this.prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { totalGames: { increment: 1 } },
        });

        return this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: { include: { user: true } } },
        });
    }

    async registerUser(data: RegisterUserDto) {
        const { telegramId, username, firstName, lastName } = data;

        let user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    telegramId,
                    username,
                    firstName,
                    lastName,
                },
            });
        }

        return user;
    }

    async splitAndFinishTable(tableId: number): Promise<void> {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: {
                tableUsers: {
                    include: { user: true },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });

        if (!table || table.status !== TableStatus.OPEN) {
            throw new BadRequestException('Стол не найден или не активен');
        }

        const players = table.tableUsers;
        if (players.length < 2) {
            throw new BadRequestException('Недостаточно игроков для деления');
        }

        const winner = players[0];
        const remainingPlayers = players.slice(1);

        const shuffled = remainingPlayers.sort(() => Math.random() - 0.5);
        const half = Math.ceil(shuffled.length / 2);
        const groupA = shuffled.slice(0, half);
        const groupB = shuffled.slice(half);

        const createTableWithPlayers = async (playerGroup) => {
            const randomString = Math.random().toString(36).substring(2, 15);
            const botName = this.configService.get('TELEGRAM_BOT_NAME');
            const inviteLink = `https://t.me/${botName}?start=table_${randomString}`;

            const newTable = await this.prisma.table.create({
                data: {
                    prizeFund: table.prizeFund,
                    inviteLink,
                    status: TableStatus.OPEN,
                },
            });

            await this.prisma.tableUser.createMany({
                data: playerGroup.map((p) => ({
                    userId: p.userId,
                    tableId: newTable.id,
                    joinedAt: new Date(),
                })),
            });
        };

        await createTableWithPlayers(groupA);
        await createTableWithPlayers(groupB);

        await this.prisma.table.update({
            where: { id: tableId },
            data: { status: TableStatus.FINISHED },
        });

        await this.prisma.user.update({
            where: { id: winner.userId },
            data: { wonTables: { increment: 1 } },
        });

        await this.prisma.user.updateMany({
            where: { id: { in: players.map((p) => p.userId) } },
            data: { totalGames: { increment: 1 } },
        });
    }
}
