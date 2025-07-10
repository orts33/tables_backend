// 📁 __tests__/table.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { prisma } from './setup';
import { Decimal } from 'decimal.js';

const TableType = {
    LINEAR: 'LINEAR',
    RANDOM: 'RANDOM'
};

const TableStatus = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    FINISHED: 'FINISHED'
};

describe('TableController (e2e)', () => {
    let app: INestApplication;
    let prismaService: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService)
            .useValue(prisma)
            .compile();

        app = moduleFixture.createNestApplication();
        prismaService = moduleFixture.get<PrismaService>(PrismaService);
        await app.init();
    });

    beforeEach(async () => {
        await prismaService.tablePrize.deleteMany();
        await prismaService.tableUser.deleteMany();
        await prismaService.table.deleteMany();
        await prismaService.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /tables/join should increase XP on first join', async () => {
        const user = await prismaService.user.create({
            data: { telegramId: '456', username: 'user' },
        });

        const table = await prismaService.table.create({
            data: {
                type: TableType.LINEAR,
                entryFee: new Decimal(5),
                prizeFund: 45,
                status: TableStatus.OPEN,
                inviteLink: 'https://t.me/@TestBot?start=table_123',
            },
        });

        const response = await request(app.getHttpServer())
            .post('/tables/join')
            .send({ tableId: table.id, telegramId: '456' })
            .expect(200);

        expect(response.body.tableUsers).toHaveLength(1);

        const updatedUser = await prismaService.user.findUnique({ where: { telegramId: '456' } });
        expect(updatedUser.xp).toBe(10);
    });
});
