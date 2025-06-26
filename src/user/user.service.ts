import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto, RegisterUserDto } from './user.dto';
import { createHmac } from 'crypto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    private mapToUserResponseDto(user: any): UserResponseDto {
        return {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            first_name: user.firstName,
            last_name: user.lastName,
            photo_url: user.photoUrl,
            balance: user.balance.toNumber(),
            wonTables: user.wonTables,
            totalGames: user.totalGames,
            level: user.level,
            xp: user.xp,
        };
    }

    async registerUser(data: RegisterUserDto): Promise<UserResponseDto> {
        const { telegramId, username, firstName, lastName, photoUrl, referrerId } = data;

        // Проверяем реферера, если указан
        let referrer = null;
        if (referrerId) {
            referrer = await this.prisma.user.findUnique({
                where: { telegramId: referrerId },
            });
            if (!referrer) {
                throw new BadRequestException(`Реферер с telegramId ${referrerId} не найден`);
            }
            if (referrerId === telegramId) {
                throw new BadRequestException('Пользователь не может быть своим собственным реферером');
            }
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { telegramId },
        });

        if (existingUser) {
            // Обновляем данные существующего пользователя
            const updatedUser = await this.prisma.user.update({
                where: { telegramId },
                data: {
                    username: username || existingUser.username,
                    firstName: firstName || existingUser.firstName,
                    lastName: lastName || existingUser.lastName,
                    photoUrl: photoUrl || existingUser.photoUrl,
                },
            });
            return this.mapToUserResponseDto(updatedUser);
        }

        // Создаем нового пользователя
        const newUser = await this.prisma.user.create({
            data: {
                telegramId,
                username,
                firstName,
                lastName,
                photoUrl,
                balance: 0,
                level: 1,
                xp: 0,
                wonTables: 0,
                totalGames: 0,
            },
        });

        // Создаем запись в таблице Referral, если есть реферер
        if (referrer) {
            await this.prisma.referral.create({
                data: {
                    referrerId: referrer.id,
                    referredId: newUser.id,
                },
            });
        }

        return this.mapToUserResponseDto(newUser);
    }

    async authTelegram(initData: string): Promise<UserResponseDto> {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            throw new BadRequestException('Bot token не настроен');
        }

        // Парсинг initData
        const params = new URLSearchParams(initData);
        const userData = params.get('user');
        const startParam = params.get('start_param') || '';
        if (!userData) {
            throw new BadRequestException('Данные пользователя отсутствуют');
        }

        // Проверка подписи
        const dataCheckString = [...params.entries()]
            .filter(([key]) => key !== 'hash')
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
        const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        if (hash !== params.get('hash')) {
            throw new BadRequestException('Недействительная подпись');
        }

        const telegramUser = JSON.parse(userData);
        const { id: telegramId, first_name, last_name, username, photo_url } = telegramUser;

        // Извлекаем referrerId из start_param
        let referrerId: string | null = null;
        if (startParam.startsWith('ref_')) {
            referrerId = startParam.replace('ref_', '');
        }

        console.log(`Авторизация пользователя: telegramId=${telegramId}${referrerId ? `, referrerId=${referrerId}` : ''}`);

        // Регистрация или обновление пользователя
        return await this.registerUser({
            telegramId: telegramId.toString(),
            firstName: first_name,
            lastName: last_name,
            username,
            photoUrl: photo_url,
            referrerId,
        });
    }

    async getUser(telegramId: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
            include: {
                clan: {
                    include: {
                        creator: { select: { username: true } },
                        members: { select: { id: true } },
                    },
                },
            },
        });
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return {
            ...this.mapToUserResponseDto(user),
            clan: user.clan,
        };
    }

    async createOrUpdateUser(data: {
        telegramId: string;
        first_name?: string;
        username?: string;
        photo_url?: string;
        last_name?: string;
        referrerId?: string | null;
    }): Promise<UserResponseDto> {
        const { telegramId, first_name, last_name, username, photo_url, referrerId } = data;

        // Проверяем реферера, если указан
        let referrer = null;
        if (referrerId) {
            referrer = await this.prisma.user.findUnique({
                where: { telegramId: referrerId },
            });
            if (!referrer) {
                throw new BadRequestException(`Реферер с telegramId ${referrerId} не найден`);
            }
            if (referrerId === telegramId) {
                throw new BadRequestException('Пользователь не может быть своим собственным реферером');
            }
        }

        const existing = await this.prisma.user.findUnique({
            where: { telegramId },
        });

        if (existing) {
            const updatedUser = await this.prisma.user.update({
                where: { telegramId },
                data: {
                    firstName: first_name || existing.firstName,
                    username: username || existing.username,
                    photoUrl: photo_url || existing.photoUrl,
                    lastName: last_name || existing.lastName,
                },
            });
            return this.mapToUserResponseDto(updatedUser);
        }

        const newUser = await this.prisma.user.create({
            data: {
                telegramId,
                firstName: first_name || null,
                username: username || null,
                photoUrl: photo_url || null,
                lastName: last_name || null,
                balance: 0,
                totalGames: 0,
                wonTables: 0,
                level: 1,
                xp: 0,
            },
        });

        // Создаем запись в таблице Referral, если есть реферер
        if (referrer) {
            await this.prisma.referral.create({
                data: {
                    referrerId: referrer.id,
                    referredId: newUser.id,
                },
            });
        }

        return this.mapToUserResponseDto(newUser);
    }

    async getLeaderboard(limit: number = 10): Promise<any[]> {
        try {
            const users = await this.prisma.user.findMany({
                orderBy: { xp: 'desc' },
                take: limit,
            });

            return users.map((user) => this.mapToUserResponseDto(user));
        } catch (error) {
            console.error('Ошибка получения таблицы лидеров:', error);
            throw new BadRequestException('Не удалось получить таблицу лидеров');
        }
    }

    async increaseBalance(telegramId: string, amount: number): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
            select: { balance: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        await this.prisma.user.update({
            where: { telegramId },
            data: {
                balance: user.balance.plus(amount),
            },
        });
    }


    async getBalanceByTelegramId(telegramId: string): Promise<number> {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
            select: { balance: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return user.balance.toNumber(); // если `balance` — это Decimal
    }
}
