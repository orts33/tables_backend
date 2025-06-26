import { ApiProperty } from '@nestjs/swagger';

export class LevelResponseDto {
    @ApiProperty({ example: 5, description: 'Текущий уровень' })
    level: number;

    @ApiProperty({ example: 500, description: 'Текущий опыт' })
    xp: number;

    @ApiProperty({ example: 600, description: 'Необходимый опыт для следующего уровня' })
    nextLevelXp: number;

    @ApiProperty({ example: 100, description: 'Токены' })
    tokens: number;
}

export class LevelRewardDto {
    @ApiProperty({ example: 1, description: 'ID бонуса' })
    id: number;

    @ApiProperty({ example: 10, description: 'Уровень' })
    level: number;

    @ApiProperty({ example: 'PRIZE_BOOST', description: 'Тип бонуса' })
    rewardType: string;

    @ApiProperty({ example: 2, description: 'Значение бонуса (например, %)' })
    amount?: number;
}
