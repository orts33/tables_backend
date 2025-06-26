// level.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LevelService {
    private readonly LEVEL_REWARDS = {
        10: { type: 'PRIZE_BOOST', amount: 2 },
        20: { type: 'FREE_ENTRY', amount: 3 },
        30: { type: 'PREMIUM_TABLE_ACCESS', amount: null },
        40: { type: 'REFERRAL_BONUS_BOOST', amount: 5 },
        50: { type: 'VIP_CLAN', amount: null },
        60: { type: 'DOUBLE_XP', amount: null },
        70: { type: 'DISCOUNT', amount: 10 },
        80: { type: 'EXCLUSIVE_AVATAR', amount: null },
        90: { type: 'PRIZE_BOOST', amount: 10 },
        100: { type: 'LEGEND_STATUS', amount: 5 },
    };

    constructor(private readonly prisma: PrismaService) {}

    async getLevel(telegramId: string) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
            select: { level: true, xp: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        const nextLevelXp = this.calculateNextLevelXp(user.level);
        return {
            level: user.level,
            xp: user.xp,
            nextLevelXp,
        };
    }

    async addXp(telegramId: string, xp: number) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
            select: { id: true, level: true, xp: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        let newXp = user.xp + xp;
        let newLevel = user.level;

        while (newXp >= this.calculateNextLevelXp(newLevel)) {
            newXp -= this.calculateNextLevelXp(newLevel);
            newLevel++;
            await this.awardLevelReward(user.id, newLevel);
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { xp: newXp, level: newLevel },
        });

        return this.getLevel(telegramId);
    }

    async getRewards(telegramId: string) {
        const user = await this.prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return this.prisma.levelReward.findMany({
            where: { userId: user.id },
        });
    }

    private calculateNextLevelXp(level: number): number {
        return Math.round(100 * level * Math.pow(1.1, level));
    }

    private async awardLevelReward(userId: number, level: number) {
        const reward = this.LEVEL_REWARDS[level];
        if (reward) {
            await this.prisma.levelReward.create({
                data: {
                    userId,
                    level,
                    rewardType: reward.type,
                    amount: reward.amount,
                },
            });
        }
    }
}
