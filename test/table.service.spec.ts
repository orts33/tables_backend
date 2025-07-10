// 📁 __tests__/table.service.spec.ts

import { TableService } from '../src/table/table.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import Decimal from 'decimal.js';

// Используем строки вместо enum
const TableType = {
    LINEAR: 'LINEAR',
    RANDOM: 'RANDOM'
};

const TableStatus = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    FINISHED: 'FINISHED'
};

describe('TableService', () => {
    let service: TableService;
    let prisma: any;
    let config: ConfigService;

    beforeEach(async () => {
        const prismaMock = {
            table: {
                findFirst: jest.fn(),
                create: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                findMany: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
            },
            tableUser: {
                create: jest.fn(),
                createMany: jest.fn(),
                updateMany: jest.fn(),
            },
            tablePrize: {
                create: jest.fn(),
                createMany: jest.fn(),
                findMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation((cb) => cb(prismaMock)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TableService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('TestBot'),
                    },
                },
            ],
        }).compile();

        service = module.get<TableService>(TableService);
        prisma = module.get<PrismaService>(PrismaService);
        config = module.get<ConfigService>(ConfigService);
    });

    it('should throw if user has insufficient balance', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, balance: new Decimal(2) });
        prisma.table.findUnique.mockResolvedValue({
            id: 1,
            status: TableStatus.OPEN,
            entryFee: new Decimal(5),
            type: TableType.LINEAR,
            tableUsers: [],
        });

        await expect(service.joinTable({ tableId: 1, telegramId: '123' })).rejects.toThrow(
            BadRequestException
        );
    });

    it('should split and finish a linear table correctly', async () => {
        const mockPlayers = Array.from({ length: 15 }).map((_, i) => ({
            userId: i + 1,
            user: { id: i + 1 },
            joinedAt: new Date(Date.now() - i * 1000),
        }));

        prisma.table.findUnique.mockResolvedValue({
            id: 1,
            type: TableType.LINEAR,
            entryFee: new Decimal(5),
            prizeFund: 60,
            status: TableStatus.OPEN,
            tableUsers: mockPlayers,
        });

        prisma.table.create.mockResolvedValue({ id: 2 });
        prisma.tableUser.createMany.mockResolvedValue({});
        prisma.table.update.mockResolvedValue({});
        prisma.user.update.mockResolvedValue({});
        prisma.tablePrize.create.mockResolvedValue({});
        prisma.user.updateMany.mockResolvedValue({});

        await service.splitAndFinishLinearTable(1);

        expect(prisma.table.create).toHaveBeenCalledTimes(2);
        expect(prisma.tableUser.createMany).toHaveBeenCalledTimes(2);
        expect(prisma.user.update).toHaveBeenCalled();
        expect(prisma.user.updateMany).toHaveBeenCalled();
    });

    it('should throw if table is already full', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, balance: new Decimal(10) });
        prisma.table.findUnique.mockResolvedValue({
            id: 1,
            status: TableStatus.OPEN,
            entryFee: new Decimal(5),
            type: TableType.LINEAR,
            tableUsers: Array.from({ length: 15 }).map((_, i) => ({ userId: i + 1 })),
        });

        await expect(service.joinTable({ tableId: 1, telegramId: '123' })).rejects.toThrow(
            BadRequestException
        );
    });
});
