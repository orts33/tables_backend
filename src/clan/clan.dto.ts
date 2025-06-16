import { ApiProperty } from '@nestjs/swagger';

export class CreateClanDto {
    @ApiProperty({
        description: 'Название клана',
        example: 'Мой Клан',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'Telegram ID пользователя, создающего клан',
        example: '123456789',
        type: String,
    })
    telegramId: string;
}

export class JoinClanDto {
    @ApiProperty({
        description: 'Telegram ID пользователя',
        example: '123456789',
        type: String,
    })
    telegramId: string;
}

export class UserSummaryDto {
    @ApiProperty({
        description: 'Имя пользователя в Telegram',
        example: '@creator',
        required: false,
        type: String,
    })
    username?: string;
}

export class MemberSummaryDto {
    @ApiProperty({
        description: 'ID пользователя',
        example: 1,
        type: Number,
    })
    id: number;
}

export class ClanResponseDto {
    @ApiProperty({
        description: 'ID клана',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Название клана',
        example: 'Мой Клан',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'Создатель клана',
        type: UserSummaryDto,
    })
    creator: UserSummaryDto;

    @ApiProperty({
        description: 'Участники клана',
        type: [MemberSummaryDto],
    })
    members: MemberSummaryDto[];

    @ApiProperty({
        description: 'Дата создания',
        example: '2025-06-10T12:00:00Z',
        type: String,
        format: 'date-time',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Дата обновления',
        example: '2025-06-10T12:00:00Z',
        type: String,
        format: 'date-time',
    })
    updatedAt: Date;
}
