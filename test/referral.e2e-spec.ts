// referral.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { prisma } from './setup';
import {INestApplication} from "@nestjs/common";

describe('ReferralController (e2e)', () => {
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

    afterEach(async () => {
        await prismaService.referralReward.deleteMany();
        await prismaService.referral.deleteMany();
        await prismaService.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /referrals should create a referral', async () => {
        const referrer = await prismaService.user.create({
            data: { telegramId: '123', username: 'referrer' },
        });
        const referred = await prismaService.user.create({
            data: { telegramId: '456', username: 'referred' },
        });

        const response = await request(app.getHttpServer())
            .post('/referrals')
            .send({ referrerTelegramId: '123', referredTelegramId: '456' })
            .expect(201);

        expect(response.body.referrerId).toBe(referrer.id);
        expect(response.body.referredId).toBe(referred.id);
    });
});
