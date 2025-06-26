import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            throw new UnauthorizedException('Токен не предоставлен');
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET) as { telegramId: string; role: string };
            if (payload.role !== 'admin') {
                throw new UnauthorizedException('Доступ запрещен: требуется роль администратора');
            }
            request.user = payload;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Неверный или истекший токен');
        }
    }
}
