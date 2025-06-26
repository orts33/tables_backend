import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { prisma } from './setup';

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

    afterEach(async () => {
        await prismaService.table.deleteMany();
        await prismaService.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /tables should create a linear table', async () => {
        const createTableDto = { entryFee: 5, type: 'LINEAR' };
        const response = await request(app.getHttpServer())
            .post('/tables')
            .send(createTableDto)
            .expect(201);

        expect(response.body.entryFee).toBe(5);
        expect(response.body.type).toBe('LINEAR');
        expect(response.body.prizeFund).toBe(45); // 15 * 5 * (1 - 0.4)

        const table = await prismaService.table.findFirst({ where: { id: response.body.id } });
        expect(table).toBeDefined();
    });

    it('POST /tables should return 400 for existing table', async () => {
        await prismaService.table.create({
            data: {
                type: 'LINEAR',
                entryFee: 5,
                prizeFund: 45,
                status: 'OPEN',
                inviteLink: 'https://t.me/@TestBot?start=table_123',
            },
        });

        const createTableDto = { entryFee: 5, type: 'LINEAR' };
        await request(app.getHttpServer())
            .post('/tables')
            .send(createTableDto)
            .expect(400);
    });
});
