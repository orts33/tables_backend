import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async getUser(telegramId: string) {
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
        return user;
    }
}
