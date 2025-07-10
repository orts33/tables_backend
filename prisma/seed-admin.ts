import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('kool', 10);

    await prisma.adminUser.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password,
        },
    });

    console.log('✅ Админ создан');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
