import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClanService {
    constructor(private prisma: PrismaService) {}

    async getClans() {
        return this.prisma.clan.findMany({
            include: {
                creator: { select: { username: true } },
                members: { select: { id: true } },
            },
        });
    }

    async createClan(name: string, telegramId: string) {
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            throw new BadRequestException('Пользователь не найден');
        }
        if (user.totalGames < 10) {
            throw new BadRequestException('Для создания клана нужно сыграть минимум 10 игр');
        }
        if (user.clanId) {
            throw new BadRequestException('Вы уже состоите в клане');
        }
        return this.prisma.clan.create({
            data: {
                name,
                creatorId: user.id,
                members: { connect: { id: user.id } },
            },
            include: {
                creator: { select: { username: true } },
                members: { select: { id: true } },
            },
        });
    }

    async joinClan(clanId: number, telegramId: string) {
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            throw new BadRequestException('Пользователь не найден');
        }
        if (user.clanId) {
            throw new BadRequestException('Вы уже состоите в клане');
        }
        const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
        if (!clan) {
            throw new BadRequestException('Клан не найден');
        }
        return this.prisma.user.update({
            where: { id: user.id },
            data: { clanId },
            include: {
                clan: {
                    include: {
                        creator: { select: { username: true } },
                        members: { select: { id: true } },
                    },
                },
            },
        });
    }
}
