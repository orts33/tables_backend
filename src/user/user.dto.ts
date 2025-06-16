import { ApiProperty } from '@nestjs/swagger';
import { ClanResponseDto } from '../clan/clan.dto';

export class UserResponseDto {
    @ApiProperty({
        description: 'ID пользователя',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Telegram ID пользователя',
        example: '123456789',
        type: String,
    })
    telegramId: string;

    @ApiProperty({
        description: 'Имя пользователя в Telegram',
        example: '@username',
        required: false,
        type: String,
    })
    username?: string;

    @ApiProperty({
        description: 'Имя пользователя',
        example: 'Иван',
        required: false,
        type: String,
    })
    firstName?: string;

    @ApiProperty({
        description: 'Фамилия пользователя',
        example: 'Иванов',
        required: false,
        type: String,
    })
    lastName?: string;

    @ApiProperty({
        description: 'Клан пользователя',
        type: ClanResponseDto,
        required: false,
    })
    clan?: ClanResponseDto;

    @ApiProperty({
        description: 'Количество выигранных столов',
        example: 5,
        type: Number,
    })
    wonTables: number;

    @ApiProperty({
        description: 'Общее количество игр',
        example: 15,
        type: Number,
    })
    totalGames: number;

    @ApiProperty({
        description: 'Дата создания',
        example: '2025-06-10T12:00:00Z',
        type: String,
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Дата обновления',
        example: '2025-06-10T12:00:00Z',
        type: String,
    })
    updatedAt: Date;
}
