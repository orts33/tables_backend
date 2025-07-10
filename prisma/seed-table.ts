// prisma/seed.ts
import { PrismaClient, TableType, TableStatus } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

// --- Настройки ---
const DEFAULT_USER_COUNT = 20;
const DEFAULT_FILL_PER_TABLE = 5;
const DEFAULT_TABLE_COUNT = 5;
const MAX_USERS_PER_TABLE = 15;
const BOT_NAME = process.env.TELEGRAM_BOT_NAME || 'your_bot_username';

async function main() {
    const users = [];
    for (let i = 0; i < DEFAULT_USER_COUNT; i++) {
        const telegramId = (100000 + i).toString();
        const user = await prisma.user.upsert({
            where: { telegramId },
            update: {},
            create: {
                telegramId,
                username: `mock_user_${telegramId}`,
                firstName: `User${i + 1}`,
                photoUrl: `https://example.com/avatar/${i + 1}.png`,
                level: Math.floor(Math.random() * 5) + 1,
                xp: Math.floor(Math.random() * 5000),
                balance: new Decimal(Math.floor(Math.random() * 1000)),
                totalGames: Math.floor(Math.random() * 50),
                wonTables: Math.floor(Math.random() * 10),
            },
        });
        users.push(user);
    }

    const tables = [];
    const entryFees = [new Decimal(3.0), new Decimal(5.0), new Decimal(10.0)];
    const tableTypes = [TableType.LINEAR, TableType.RANDOM];

    for (let i = 0; i < DEFAULT_TABLE_COUNT; i++) {
        const entryFee = entryFees[Math.floor(Math.random() * entryFees.length)];
        const table = await prisma.table.create({
            data: {
                type: tableTypes[Math.floor(Math.random() * tableTypes.length)],
                entryFee,
                prizeFund: 0, // будет обновлён после наполнения
                status: TableStatus.OPEN,
                inviteLink: `https://t.me/${BOT_NAME}?start=table_mock_${i + 1}`,
            },
        });
        tables.push(table);
    }

    for (const table of tables) {
        const maxUsersToAdd = MAX_USERS_PER_TABLE - 1; // оставляем одно место
        const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, maxUsersToAdd);
        for (let i = 0; i < selectedUsers.length; i++) {
            await prisma.tableUser.create({
                data: {
                    userId: selectedUsers[i].id,
                    tableId: table.id,
                    isFirstBet: i === 0,
                },
            });
        }

        const updatedPrizeFund = table.entryFee.mul(selectedUsers.length).toNumber();
        await prisma.table.update({
            where: { id: table.id },
            data: { prizeFund: updatedPrizeFund },
        });

        console.log(`👥 Заселено ${selectedUsers.length} пользователей в стол #${table.id} (макс - 1)`);
    }

    console.log(`✅ Сид завершён. Создано:`);
    console.log(`- Пользователей: ${users.length}`);
    console.log(`- Столов: ${tables.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Ошибка при сидировании:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
