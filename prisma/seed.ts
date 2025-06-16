// prisma/seed.ts
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const BOT_NAME    = process.env.TELEGRAM_BOT_NAME || 'your_bot_username'
    const TOTAL_USERS = 100    // всего пользователей в пулле
    const TOTAL_TABLES = 10    // сколько столов создать
    const MAX_PLAYERS  = 14    // макс. игроков в столе (<15)

    // 1) Создаём пулл пользователей
    const users = []
    for (let i = 0; i < TOTAL_USERS; i++) {
        // prisma-схема: telegramId — String
        const telegramId = (100_000 + i).toString()
        const user = await prisma.user.upsert({
            where: { telegramId },
            update: {},
            create: {
                telegramId,
                username:  `mock_user_${telegramId}`,
                firstName: `User${i + 1}`,
            },
        })
        users.push(user)
    }

    // 2) Создаём столы (status по умолчанию OPEN)
    const tables = []
    for (let t = 0; t < TOTAL_TABLES; t++) {
        const table = await prisma.table.create({
            data: {
                prizeFund:  Math.floor(Math.random() * 1000) + 100,
                inviteLink: `https://t.me/${BOT_NAME}?start=table_mock_${t + 1}`,
                // статус не указываем – будет OPEN
            },
        })
        tables.push(table)
    }

    // 3) Равномерно и случайно распределяем пользователей по столам
    let idx = 0
    for (const table of tables) {
        // число участников от 1 до MAX_PLAYERS
        const count = Math.floor(Math.random() * MAX_PLAYERS) + 1
        const group = users.slice(idx, idx + count)
        idx += count
        for (const u of group) {
            await prisma.tableUser.create({
                data: {
                    tableId: table.id,
                    userId:  u.id,
                    // joinedAt заполнится автоматически
                },
            })
        }
        // если мы вышли за конец массива пользователей — начнём сначала
        if (idx >= users.length) idx = 0
    }

    console.log(`✅ Сгенерировано ${TOTAL_USERS} пользователей и ${TOTAL_TABLES} открытых столов`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
