import { ApiProperty } from '@nestjs/swagger';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
    @ApiProperty({
        description: 'Призовой фонд стола',
        example: 1000,
        type: Number,
    })
    prizeFund: number;
}

export class JoinTableDto {
    @ApiProperty({
        description: 'ID стола',
        example: 1,
        type: Number,
    })
    tableId: number;

    @ApiProperty({
        description: 'Telegram ID пользователя',
        example: '123456789',
        type: String,
    })
    telegramId: string;
}

export class RegisterUserDto {
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
}

export class TableResponseDto {
    @ApiProperty({
        description: 'ID стола',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Призовой фонд стола',
        example: 1000,
        type: Number,
    })
    prizeFund: number;

    @ApiProperty({
        description: 'Статус стола',
        example: TableStatus.OPEN,
        enum: TableStatus,
    })
    status: TableStatus;

    @ApiProperty({
        description: 'Ссылка для приглашения',
        example: 'https://t.me/BotName?start=table_abc123',
        type: String,
    })
    inviteLink: string;

    @ApiProperty({
        description: 'Участники стола',
        type: [Object],
        example: [{ id: 1, user: { username: '@username' } }],
    })
    tableUsers: { id: number; user: { username?: string } }[];

    @ApiProperty({
        description: 'Дата создания',
        example: '2025-06-10T12:00:56Z',
        type: String,
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Дата обновления',
        example: '2025-06-10T12:00:56Z',
        type: String,
    })
    updatedAt: Date;
}


export class TableUserDto {
    @ApiProperty({ description: 'ID связи пользователь–стол' })
    id: number;

    @ApiProperty({ description: 'ID пользователя' })
    userId: number;

    @ApiProperty({ description: 'Время входа пользователя в стол' })
    joinedAt: Date;
}
