// level.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { prisma } from './setup';
import {INestApplication} from "@nestjs/common";

describe('LevelController (e2e)', () => {
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
        await prismaService.levelReward.deleteMany();
        await prismaService.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /levels/:telegramId should return level info', async () => {
        await prismaService.user.create({
            data: { telegramId: '123', username: 'test_user', level: 5, xp: 500 },
        });

        const response = await request(app.getHttpServer())
            .get('/levels/123')
            .expect(200);

        expect(response.body.level).toBe(5);
        expect(response.body.xp).toBe(500);
        expect(response.body.nextLevelXp).toBeGreaterThan(500);
    });
});
