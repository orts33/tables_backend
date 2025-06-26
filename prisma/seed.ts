import { PrismaClient, TableType, TableStatus, RewardType } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    const BOT_NAME = process.env.TELEGRAM_BOT_NAME || 'your_bot_username';
    const TOTAL_USERS = 100; // Всего пользователей
    const TOTAL_TABLES = 10; // Всего столов
    const MAX_PLAYERS = 14; // Максимум игроков в столе (<15)
    const TOTAL_CLANS = 5; // Количество кланов
    const TOTAL_REFERRALS = 20; // Количество реферальных связей
    const TOTAL_INVOICES = 10; // Количество инвойсов
    const TOTAL_LEVEL_REWARDS = 10; // Количество наград за уровни

    // 1) Создаём пул пользователей
    const users = [];
    for (let i = 0; i < TOTAL_USERS; i++) {
        const telegramId = (100_000 + i).toString();
        const user = await prisma.user.upsert({
            where: { telegramId },
            update: {},
            create: {
                telegramId,
                username: `mock_user_${telegramId}`,
                firstName: `User${i + 1}`,
                photoUrl: `https://example.com/avatars/user${i + 1}.png`,
                level: Math.floor(Math.random() * 5) + 1, // Уровень от 1 до 5
                xp: Math.floor(Math.random() * 5000), // XP от 0 до 5000
                balance: new Decimal(Math.floor(Math.random() * 1000)), // Баланс от 0 до 1000
                totalGames: Math.floor(Math.random() * 50), // Сыграно игр от 0 до 50
                wonTables: Math.floor(Math.random() * 10), // Побед от 0 до 10
            },
        });
        users.push(user);
    }

    // 2) Создаём кланы
    const clans = [];
    for (let i = 0; i < TOTAL_CLANS; i++) {
        const creator = users[i];
        const clan = await prisma.clan.create({
            data: {
                name: `Clan_${i + 1}`,
                creatorId: creator.id,
                createdAt: new Date(),
            },
        });
        clans.push(clan);
    }

    // 3) Распределяем пользователей по кланам
    for (let i = 0; i < TOTAL_USERS; i++) {
        if (Math.random() > 0.3) { // 70% шанс, что пользователь в клане
            const clan = clans[Math.floor(Math.random() * TOTAL_CLANS)];
            await prisma.user.update({
                where: { id: users[i].id },
                data: { clanId: clan.id },
            });
        }
    }

    // 4) Создаём столы
    const tables = [];
    const entryFees = [new Decimal(3.0), new Decimal(5.0), new Decimal(10.0)]; // Возможные ставки
    const tableTypes = [TableType.LINEAR, TableType.RANDOM];
    for (let t = 0; t < TOTAL_TABLES; t++) {
        const entryFee = entryFees[Math.floor(Math.random() * entryFees.length)];
        const table = await prisma.table.create({
            data: {
                type: tableTypes[Math.floor(Math.random() * tableTypes.length)],
                entryFee,
                prizeFund: Math.floor(entryFee.times(Math.floor(Math.random() * 10) + 5).toNumber()), // Призовой фонд: entryFee * (5-15)
                status: TableStatus.OPEN,
                inviteLink: `https://t.me/${BOT_NAME}?start=table_mock_${t + 1}`,
                createdAt: new Date(),
            },
        });
        tables.push(table);
    }

    // 5) Распределяем пользователей по столам
    const userBetCount = new Map<number, number>(); // Отслеживаем количество ставок для каждого пользователя
    let idx = 0;
    for (const table of tables) {
        const count = Math.floor(Math.random() * MAX_PLAYERS) + 1; // 1–14 игроков
        const group = users.slice(idx, idx + count);
        idx += count;
        for (const user of group) {
            // Проверяем количество ставок пользователя
            const betCount = userBetCount.get(user.id) || 0;
            const isFirstBet = betCount === 0;
            userBetCount.set(user.id, betCount + 1);

            // Создаём запись о присоединении к столу
            await prisma.tableUser.create({
                data: {
                    tableId: table.id,
                    userId: user.id,
                    joinedAt: new Date(),
                    isFirstBet,
                },
            });
        }
        if (idx >= users.length) idx = 0; // Циклический обход пользователей
    }

    // 6) Создаём реферальные связи
    const referrals = [];
    for (let i = 0; i < TOTAL_REFERRALS; i++) {
        const referrer = users[Math.floor(Math.random() * TOTAL_USERS)];
        const referred = users[Math.floor(Math.random() * TOTAL_USERS)];
        if (referrer.id !== referred.id) { // Исключаем саморефералы
            const existingReferral = await prisma.referral.findFirst({
                where: { referredId: referred.id },
            });
            if (!existingReferral) { // Проверяем, что у пользователя нет реферера
                const referral = await prisma.referral.create({
                    data: {
                        referrerId: referrer.id,
                        referredId: referred.id,
                        createdAt: new Date(),
                    },
                });
                referrals.push(referral);
            }
        }
    }

    // 7) Создаём инвойсы
    for (let i = 0; i < TOTAL_INVOICES; i++) {
        const user = users[Math.floor(Math.random() * TOTAL_USERS)];
        await prisma.invoice.create({
            data: {
                id: `mock_invoice_${i + 1}`,
                userId: user.id,
                amount: Math.floor(Math.random() * 500) + 50, // Сумма 50–550
                currency: ['USDT', 'BTC', 'ETH'][Math.floor(Math.random() * 3)],
                status: ['pending', 'paid', 'failed'][Math.floor(Math.random() * 3)],
                createdAt: new Date(),
                paidAt: Math.random() > 0.5 ? new Date() : null, // 50% шанс оплаты
            },
        });
    }

    // 8) Создаём награды за уровни
    const rewardTypes = [
        RewardType.PRIZE_BOOST,
        RewardType.FREE_ENTRY,
        RewardType.PREMIUM_TABLE_ACCESS,
        RewardType.VIP_CLAN,
        RewardType.DOUBLE_XP,
        RewardType.DISCOUNT,
        RewardType.EXCLUSIVE_AVATAR,
        RewardType.LEGEND_STATUS,
    ];
    for (let i = 0; i < TOTAL_LEVEL_REWARDS; i++) {
        const user = users[Math.floor(Math.random() * TOTAL_USERS)];
        await prisma.levelReward.create({
            data: {
                userId: user.id,
                level: Math.floor(Math.random() * 5) + 1, // Уровень 1–5
                rewardType: rewardTypes[Math.floor(Math.random() * rewardTypes.length)],
                amount: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 10 : null, // Сумма 10–110 или null
                createdAt: new Date(),
            },
        });
    }

    // 9) Создаём призовые записи для столов
    for (const table of tables) {
        const tableUsers = await prisma.tableUser.findMany({ where: { tableId: table.id } });
        if (tableUsers.length > 0) {
            const winner = tableUsers[Math.floor(Math.random() * tableUsers.length)];
            await prisma.tablePrize.create({
                data: {
                    tableId: table.id,
                    userId: winner.userId,
                    position: 1,
                    amount: Math.floor(table.prizeFund * 0.7), // 70% призового фонда победителю
                    createdAt: new Date(),
                },
            });
        }
    }

    console.log(
        `✅ Сгенерировано:
    - ${TOTAL_USERS} пользователей
    - ${TOTAL_CLANS} кланов
    - ${TOTAL_TABLES} столов
    - ${TOTAL_REFERRALS} реферальных связей
    - ${TOTAL_INVOICES} инвойсов
    - ${TOTAL_LEVEL_REWARDS} наград за уровни`
    );
}

main()
    .catch((e) => {
        console.error('Ошибка при сидировании:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
