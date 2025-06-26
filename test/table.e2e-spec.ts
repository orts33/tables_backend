import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { prisma } from './setup';
import {INestApplication} from "@nestjs/common";

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
        await prismaService.referralReward.deleteMany();
        await prismaService.referral.deleteMany();
        await prismaService.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /tables/join should handle referral and XP', async () => {
        const referrer = await prismaService.user.create({
            data: { telegramId: '123', username: 'referrer' },
        });
        const user = await prismaService.user.create({
            data: { telegramId: '456', username: 'user', }
        });
        await prismaService.referral.create({
            data: { referrerId: referrer.id, referredId: user.id },
        });

        const table = await prismaService.table.create({
            data: {
                type: 'LINEAR',
                entryFee: 5,
                prizeFund: 45,
                status: 'OPEN',
                inviteLink: 'https://t.me/@TestBot?start=table_123',
            },
        });

        const response = await request(app.getHttpServer())
            .post('/tables/join')
            .send({ tableId: table.id, telegramId: '456' })
            .expect(200);

        expect(response.body.tableUsers).toHaveLength(1);

        // Проверка реферальных бонусов
        const rewards = await prismaService.referralReward.findMany({
            where: { referral: { referrerId: referrer.id } },
        });
        expect(rewards).toHaveLength(1);
        expect(rewards[0].amount).toBe(0.25); // 5% от 5 (первое участие)

        // Проверка XP
        const updatedUser = await prismaService.user.findUnique({ where: { telegramId: '456' } });
        expect(updatedUser.xp).toBe(10); // XP за участие
    });
});
