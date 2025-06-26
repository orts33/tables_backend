import { Test, TestingModule } from '@nestjs/testing';
import { TableService } from '../src/table/table.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { TableType } from '@prisma/client';

describe('TableService', () => {
    let service: TableService;
    let prisma: PrismaService;
    let config: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TableService,
                {
                    provide: PrismaService,
                    useValue: {
                        table: {
                            findFirst: jest.fn(),
                            create: jest.fn(),
                        },
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('@TestBot'),
                    },
                },
            ],
        }).compile();

        service = module.get<TableService>(TableService);
        prisma = module.get<PrismaService>(PrismaService);
        config = module.get<ConfigService>(ConfigService);
    });

    it('should create a linear table with valid entryFee', async () => {
        const createTableDto = { entryFee: 5, type: TableType.LINEAR };
        jest.spyOn(prisma.table, 'findFirst').mockResolvedValue(null);
        jest.spyOn(prisma.table, 'create').mockResolvedValue({
            id: 1,
            type: TableType.LINEAR,
            entryFee: 5,
            prizeFund: 45,
            status: 'OPEN',
            inviteLink: 'https://t.me/@TestBot?start=table_random',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const result = await service.create(createTableDto);
        expect(result.entryFee).toBe(5);
        expect(result.type).toBe(TableType.LINEAR);
        expect(prisma.table.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid entryFee', async () => {
        const createTableDto = { entryFee: 7, type: TableType.LINEAR };
        await expect(service.create(createTableDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if table exists', async () => {
        const createTableDto = { entryFee: 5, type: TableType.LINEAR };
        jest.spyOn(prisma.table, 'findFirst').mockResolvedValue({ id: 1 } as any);
        await expect(service.create(createTableDto)).rejects.toThrow(BadRequestException);
    });
});
