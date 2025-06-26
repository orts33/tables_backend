import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async login(telegramId: string, password: string): Promise<{ token: string }> {
        // Проверяем, является ли пользователь администратором
        const admin = await this.prisma.user.findUnique({
            where: { telegramId },
        });

        if (!admin || admin.telegramId !== process.env.ADMIN_TELEGRAM_ID) {
            throw new UnauthorizedException('Доступ запрещен: вы не администратор');
        }

        // Здесь должна быть проверка пароля (например, с bcrypt)
        // Для простоты предположим, что пароль проверяется вручную
        if (password !== 'admin_password') { // Замените на безопасную проверку
            throw new UnauthorizedException('Неверный пароль');
        }

        // Генерируем JWT
        const token = jwt.sign(
            { telegramId, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
        );

        return { token };
    }
}
