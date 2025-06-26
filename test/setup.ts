import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: { db: { url: 'file:./test.db' } },
});

beforeAll(async () => {
    await prisma.$connect();
    // Создай таблицы
    await prisma.user.deleteMany();
    await prisma.table.deleteMany();
    await prisma.tableUser.deleteMany();
    await prisma.tablePrize.deleteMany();
    await prisma.clan.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

export { prisma };
