import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { TableStatus, TableType } from '@prisma/client';
import { CreateTableDto, JoinTableDto, TableResponseDto, UserResponseDto } from './table.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import Decimal from 'decimal.js';

@Injectable()
export class TableService {
    private readonly SYSTEM_FEE = 0.4; // 40% комиссии
    private readonly LINEAR_MAX_PLAYERS = 15;
    private readonly RANDOM_MAX_PLAYERS = 12;
    private readonly LINEAR_ENTRY_FEES = [new Decimal(3), new Decimal(5), new Decimal(10)];
    private readonly RANDOM_ENTRY_FEES = [new Decimal(3), new Decimal(5)];
    private readonly RANDOM_PRIZE_DISTRIBUTION = [0.5, 0.3, 0.2]; // 50%, 30%, 20% для топ-3
    private readonly MERGE_TIMEOUT = 10 * 60 * 1000; // 10 минут
    private readonly logger = new Logger(TableService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {}

    async create(data: CreateTableDto): Promise<TableResponseDto> {
        const { entryFee, type } = data;
        const entryFeeDecimal = new Decimal(entryFee);

        // Валидация ставки
        const validFees = type === TableType.LINEAR ? this.LINEAR_ENTRY_FEES : this.RANDOM_ENTRY_FEES;
        if (!validFees.some((fee) => fee.equals(entryFeeDecimal))) {
            throw new BadRequestException(`Некорректная ставка для стола ${type}: ${entryFee}`);
        }

        // Проверка существующего стола
        const existingTable = await this.prisma.table.findFirst({
            where: { type, entryFee: entryFeeDecimal, status: TableStatus.OPEN },
        });
        if (existingTable) {
            throw new BadRequestException(`Стол с типом ${type} и ставкой ${entryFee} уже существует`);
        }

        const randomString = Math.random().toString(36).substring(2, 15);
        const botName = this.configService.get('TELEGRAM_BOT_NAME');
        const inviteLink = `https://t.me/${botName}?start=table_${randomString}`;

        const maxPlayers = type === TableType.LINEAR ? this.LINEAR_MAX_PLAYERS : this.RANDOM_MAX_PLAYERS;
        const prizeFund = Math.floor(maxPlayers * entryFee * (1 - this.SYSTEM_FEE));

        const table = await this.prisma.table.create({
            data: {
                type,
                entryFee: entryFeeDecimal,
                prizeFund,
                inviteLink,
                status: TableStatus.OPEN,
            },
            include: {
                tableUsers: { include: { user: true } },
                tablePrizes: true,
            },
        });

        return this.mapToTableResponseDto(table);
    }

    async getTables(): Promise<TableResponseDto[]> {
        const tables = await this.prisma.table.findMany({
            where: {
              status: 'OPEN',
            },
            include: {
                tableUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                // username: true,
                                photoUrl: true,
                                level: true,
                                totalGames: true,
                                wonTables: true,
                                // telegramId НЕ включаем
                            },
                        },
                    }
                },
                tablePrizes: true,
            },
        });
        return tables.map((table) => this.mapToTableResponseDto(table));
    }

    async getTableById(id: number): Promise<TableResponseDto> {
        const table = await this.prisma.table.findUnique({
            where: { id },
            include: {
                tableUsers: { include: { user: true } },
                tablePrizes: { include: { user: true } },
            },
        });
        if (!table) {
            throw new NotFoundException('Стол не найден');
        }
        return this.mapToTableResponseDto(table);
    }

    async getLeaderboard(limit: number = 10): Promise<UserResponseDto[]> {
        try {
            const users = await this.prisma.user.findMany({
                take: Math.min(limit, 100),
                orderBy: [{ balance: 'desc' }, { wonTables: 'desc' }],
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
                    balance: true,
                    wonTables: true,
                    totalGames: true,
                    level: true,
                    xp: true,
                },
            });
            return users.map((user) => ({
                id: user.id,
                telegramId: user.telegramId,
                username: user.username,
                first_name: user.firstName,
                last_name: user.lastName,
                photo_url: user.photoUrl,
                balance: user.balance.toNumber(),
                wonTables: user.wonTables,
                totalGames: user.totalGames,
                level: user.level,
                xp: user.xp,
            }));
        } catch (error) {
            this.logger.error(`Ошибка получения таблицы лидеров: ${error.message}`, error.stack);
            throw new BadRequestException('Не удалось получить таблицу лидеров');
        }
    }

    async getTableByInviteLink(inviteLink: string): Promise<TableResponseDto | null> {
        const table = await this.prisma.table.findUnique({
            where: { inviteLink },
            include: { tableUsers: { include: { user: true } }, tablePrizes: true },
        });

        if (!table) {
            throw new BadRequestException('Стол не найден');
        }

        return table.status === TableStatus.OPEN ? this.mapToTableResponseDto(table) : null;
    }

    async joinTable(data: JoinTableDto): Promise<TableResponseDto> {
        const { tableId, telegramId } = data;

        const user = await this.userService.getUser(telegramId);
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

        const maxPlayers = table.type === TableType.LINEAR ? this.LINEAR_MAX_PLAYERS : this.RANDOM_MAX_PLAYERS;

        console.log(maxPlayers, 'ВОВВО')
        console.log(table.tableUsers.length)
        console.log(this.RANDOM_MAX_PLAYERS)
        console.log(this.LINEAR_MAX_PLAYERS)

        if (table.tableUsers.length > maxPlayers) {
            throw new BadRequestException('Стол уже заполнен');
        }

        if (table.tableUsers.some((tu) => tu.userId === user.id)) {
            throw new BadRequestException('Пользователь уже присоединился к этому столу');
        }

        if (new Decimal(user.balance).lt(new Decimal(table.entryFee))) {
            throw new BadRequestException('Недостаточно средств на балансе');
        }

        const updatedTable = await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { balance: { decrement: table.entryFee } },
            });

            const tableUpdate = await tx.table.update({
                where: { id: tableId },
                data: {
                    tableUsers: {
                        create: {
                            userId: user.id,
                            isFirstBet: await this.isFirstBet(user.id),
                        },
                    },
                    prizeFund: { increment: table.entryFee.toNumber() },
                },
                include: {
                    tableUsers: { include: { user: true } },
                    tablePrizes: true,
                },
            });

            return tableUpdate;
        });

        const currentPlayers = updatedTable.tableUsers.length;
        const isLastLinearPlayer = table.type === TableType.LINEAR && currentPlayers === this.LINEAR_MAX_PLAYERS;
        const isLastRandomPlayer = table.type === TableType.RANDOM && currentPlayers === this.RANDOM_MAX_PLAYERS;

        if (currentPlayers >= maxPlayers - 2) {
            await this.notifyTableAlmostFull(updatedTable.id);
        }

        if (isLastLinearPlayer) {
            await this.splitAndFinishLinearTable(tableId);
        } else if (isLastRandomPlayer) {
            await this.finishRandomTable(tableId);
        }

        return this.mapToTableResponseDto(updatedTable);
    }

    async finishLinearTable(tableId: number, winnerId: number): Promise<TableResponseDto> {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: true },
        });

        if (!table || table.status === TableStatus.FINISHED || table.type !== TableType.LINEAR) {
            throw new BadRequestException('Стол не найден, уже завершён или не линейный');
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
            await this.prisma.tablePrize.create({
                data: {
                    tableId,
                    userId: winner.userId,
                    position: 1,
                    amount: table.prizeFund,
                },
            });
        } else {
            throw new BadRequestException('Победитель не является участником стола');
        }

        const userIds = table.tableUsers.map((tu) => tu.userId);
        await this.prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { totalGames: { increment: 1 } },
        });

        const updatedTable = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: { include: { user: true } }, tablePrizes: true },
        });
        return this.mapToTableResponseDto(updatedTable);
    }

    async finishRandomTable(tableId: number): Promise<TableResponseDto> {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: {
                tableUsers: {
                    include: { user: true },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });

        if (!table || table.status === TableStatus.FINISHED || table.type !== TableType.RANDOM) {
            throw new BadRequestException('Стол не найден, уже завершён или не рандомный');
        }

        const players = table.tableUsers;
        if (players.length !== this.RANDOM_MAX_PLAYERS) {
            throw new BadRequestException('Недостаточно игроков для завершения');
        }

        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, 3);
        const prizeFund = table.prizeFund;

        const prizes = this.RANDOM_PRIZE_DISTRIBUTION.map((ratio, index) => ({
            position: index + 1,
            amount: Math.floor(prizeFund * ratio),
            userId: winners[index].userId,
        }));

        await this.prisma.table.update({
            where: { id: tableId },
            data: { status: TableStatus.FINISHED },
        });

        await this.prisma.tablePrize.createMany({
            data: prizes.map((prize) => ({
                tableId,
                userId: prize.userId,
                position: prize.position,
                amount: prize.amount,
            })),
        });

        if (winners[0]) {
            await this.prisma.user.update({
                where: { id: winners[0].userId },
                data: { wonTables: { increment: 1 } },
            });
        }

        const userIds = players.map((p) => p.userId);
        await this.prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { totalGames: { increment: 1 } },
        });

        await this.create({ entryFee: table.entryFee.toNumber(), type: TableType.RANDOM });

        const updatedTable = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: { include: { user: true } }, tablePrizes: true },
        });
        return this.mapToTableResponseDto(updatedTable);
    }

    async splitAndFinishLinearTable(tableId: number): Promise<void> {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: {
                tableUsers: {
                    include: { user: true },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });

        if (!table || table.status !== TableStatus.OPEN || table.type !== TableType.LINEAR) {
            throw new BadRequestException('Стол не найден, не активен или не линейный');
        }

        const players = table.tableUsers;
        if (players.length !== this.LINEAR_MAX_PLAYERS) {
            throw new BadRequestException('Недостаточно игроков для деления');
        }

        const winner = players[0];
        const remainingPlayers = players.slice(1);

        const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
        const half = Math.ceil(shuffled.length / 2);
        const groupA = shuffled.slice(0, half);
        const groupB = shuffled.slice(half);

        const createTableWithPlayers = async (playerGroup) => {
            const randomString = Math.random().toString(36).substring(2, 15);
            const botName = this.configService.get('TELEGRAM_BOT_NAME');
            const inviteLink = `https://t.me/${botName}?start=table_${randomString}`;

            const newTable = await this.prisma.table.create({
                data: {
                    type: TableType.LINEAR,
                    entryFee: table.entryFee,
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
                    isFirstBet: false,
                })),
            });
        };

        await Promise.all([createTableWithPlayers(groupA), createTableWithPlayers(groupB)]);

        await this.finishLinearTable(tableId, winner.userId);
    }

    async mergeTables(): Promise<void> {
        const tables = await this.prisma.table.findMany({
            where: {
                type: TableType.LINEAR,
                status: TableStatus.OPEN,
                updatedAt: { lte: new Date(Date.now() - this.MERGE_TIMEOUT) },
            },
            include: { tableUsers: { include: { user: true } } },
        });

        const tablesByFee = tables.reduce((acc, table) => {
            const feeKey = table.entryFee.toString();
            acc[feeKey] = acc[feeKey] || [];
            acc[feeKey].push(table);
            return acc;
        }, {} as Record<string, typeof tables>);

        for (const feeKey in tablesByFee) {
            const feeTables = tablesByFee[feeKey].sort((a, b) => b.tableUsers.length - a.tableUsers.length);
            if (feeTables.length < 2) continue;

            const primaryTable = feeTables[0];
            if (primaryTable.tableUsers.length >= this.LINEAR_MAX_PLAYERS) continue;

            for (let i = 1; i < feeTables.length; i++) {
                const secondaryTable = feeTables[i];
                const totalUsers = primaryTable.tableUsers.length + secondaryTable.tableUsers.length;

                if (totalUsers <= this.LINEAR_MAX_PLAYERS) {
                    await this.prisma.tableUser.updateMany({
                        where: { tableId: secondaryTable.id },
                        data: { tableId: primaryTable.id },
                    });

                    await this.prisma.table.update({
                        where: { id: secondaryTable.id },
                        data: { status: TableStatus.CLOSED },
                    });

                    const updatedPrimaryTable = await this.prisma.table.findUnique({
                        where: { id: primaryTable.id },
                        include: { tableUsers: { include: { user: true } } },
                    });

                    if (updatedPrimaryTable.tableUsers.length === this.LINEAR_MAX_PLAYERS) {
                        await this.splitAndFinishLinearTable(primaryTable.id);
                    }
                }
            }
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleTableMerging(): Promise<void> {
        await this.mergeTables();
    }

    async notifyTableAlmostFull(tableId: number): Promise<void> {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: { tableUsers: { include: { user: true } } },
        });

        if (!table) return;

        const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
        const botName = this.configService.get('TELEGRAM_BOT_NAME');
        const maxPlayers = table.type === TableType.LINEAR ? this.LINEAR_MAX_PLAYERS : this.RANDOM_MAX_PLAYERS;
        const remaining = maxPlayers - table.tableUsers.length;

        const message = `Стол #${table.id} (${table.type === TableType.LINEAR ? 'Линейный Турнир' : 'Рандомный Джекпот'}) почти заполнен! Осталось ${remaining} мест. Присоединяйтесь: ${table.inviteLink}`;

        this.logger.log(`[Notify] Sending to Telegram: ${message}`);
    }

    async getTableHistory(tableId: number): Promise<TableResponseDto> {
        const table = await this.prisma.table.findUnique({
            where: { id: tableId },
            include: {
                tableUsers: { include: { user: true } },
                tablePrizes: { include: { user: true } },
            },
        });

        if (!table) {
            throw new BadRequestException('Стол не найден');
        }

        return this.mapToTableResponseDto(table);
    }

    private async isFirstBet(userId: number): Promise<boolean> {
        const betCount = await this.prisma.tableUser.count({
            where: { userId },
        });
        return betCount === 0;
    }

    private mapToTableResponseDto(table: any): TableResponseDto {
        return {
            id: table.id,
            type: table.type,
            entryFee: table.entryFee.toNumber(),
            prizeFund: table.prizeFund,
            status: table.status,
            inviteLink: table.inviteLink,
            createdAt: table.createdAt,
            updatedAt: table.updatedAt,
            tableUsers: table.tableUsers
                .filter((tu) => {
                    if (!tu.user) {
                        this.logger.warn(`TableUser ${tu.id} has no associated user (userId: ${tu.userId}) for table ${table.id}`);
                        return false;
                    }
                    return true;
                })
                .map((tu) => ({
                    id: tu.id,
                    user: {
                        id: tu.user.id,
                        telegramId: tu.user.telegramId,
                        username: tu.user.username,
                        first_name: tu.user.firstName,
                        last_name: tu.user.lastName,
                        photo_url: tu.user.photoUrl,
                        // balance: tu.user.balance.toNumber(),
                        wonTables: tu.user.wonTables,
                        totalGames: tu.user.totalGames,
                        level: tu.user.level,
                        xp: tu.xp,
                    },
                    joinedAt: tu.joinedAt,
                    isFirstBet: tu.isFirstBet,
                })),
            tablePrizes: table.tablePrizes.map((tp) => ({
                id: tp.id,
                tableId: tp.tableId,
                userId: tp.userId,
                user: tp.user
                    ? {
                        id: tp.user.id,
                        telegramId: tp.user.telegramId,
                        username: tp.user.username,
                        first_name: tp.user.firstName,
                        last_name: tp.user.lastName,
                        photo_url: tp.user.photoUrl,
                        // balance: tp.user.balance.toNumber(),
                        wonTables: tp.user.wonTables,
                        totalGames: tp.user.totalGames,
                        level: tp.user.level,
                        xp: tp.xp,
                    }
                    : null,
                position: tp.position,
                amount: tp.amount,
                createdAt: tp.createdAt,
            })),
        };
    }

    async initTables(): Promise<void> {
        const variants: TableType[] = ['LINEAR', 'RANDOM'];
        const bets: number[] = [3, 5, 10];

        const tables = await this.prisma.table.findMany({
            where: { status: TableStatus.OPEN },
        });

        if (!tables.length) {
            try {
                for (const type of variants) {
                    for (const bet of bets) {
                        await this.create({
                            type,
                            entryFee: bet,
                            status: 'OPEN',
                            created_at: new Date(),
                        });
                    }
                }
            } catch (e) {
                console.error('Ошибка при создании стартовых столов:', e);
            }
        }
    }

}
