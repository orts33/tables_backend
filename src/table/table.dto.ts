import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { TableStatus, TableType } from '@prisma/client';

export class UserResponseDto {
    @ApiProperty({ example: 1, description: 'ID пользователя' })
    @IsInt()
    id: number;

    @ApiProperty({ example: '123456789', description: 'Telegram ID пользователя' })
    @IsString()
    telegramId: string;

    @ApiProperty({ example: 'ivanov', description: 'Имя пользователя в Telegram', required: false })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ example: 'Иван', description: 'Имя пользователя', required: false })
    @IsString()
    @IsOptional()
    first_name?: string;

    @ApiProperty({ example: 'Иванов', description: 'Фамилия пользователя', required: false })
    @IsString()
    @IsOptional()
    last_name?: string;

    @ApiProperty({ example: 'https://example.com/photo.jpg', description: 'URL фото профиля', required: false })
    @IsString()
    @IsOptional()
    photo_url?: string;

    @ApiProperty({ example: 100.5, description: 'Баланс пользователя' })
    @IsNumber()
    balance: number;

    @ApiProperty({ example: 5, description: 'Количество выигранных столов' })
    @IsInt()
    wonTables: number;

    @ApiProperty({ example: 10, description: 'Общее количество игр', required: false })
    @IsInt()
    @IsOptional()
    totalGames?: number;

    @ApiProperty({ example: 3, description: 'Уровень пользователя', required: false })
    @IsInt()
    @IsOptional()
    level?: number;

    @ApiProperty({ example: 500, description: 'Очки опыта', required: false })
    @IsInt()
    @IsOptional()
    xp?: number;
}

export class CreateTableDto {
    @ApiProperty({ example: 5, description: 'Входная ставка' })
    @IsNumber()
    entryFee: number;

    @ApiProperty({ enum: TableType, example: TableType.LINEAR, description: 'Тип стола' })
    @IsEnum(TableType)
    type: TableType;


    @IsEnum(TableStatus)
    @IsOptional() // если хочешь, чтобы было необязательно
    status?: TableStatus;

    created_at?: Date;

}

export class JoinTableDto {
    @ApiProperty({ example: 1, description: 'ID стола' })
    @IsInt()
    tableId: number;

    @ApiProperty({ example: '123456789', description: 'Telegram ID пользователя' })
    @IsString()
    telegramId: string;
}

export class RegisterUserDto {
    @ApiProperty({ example: '123456789', description: 'Telegram ID пользователя' })
    @IsString()
    telegramId: string;

    @ApiProperty({ example: 'ivanov', description: 'Имя пользователя в Telegram', required: false })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ example: 'Иван', description: 'Имя пользователя', required: false })
    @IsString()
    @IsOptional()
    first_name?: string;

    @ApiProperty({ example: 'Иванов', description: 'Фамилия пользователя', required: false })
    @IsString()
    @IsOptional()
    last_name?: string;

    @ApiProperty({ example: 'https://example.com/photo.jpg', description: 'URL фото профиля', required: false })
    @IsString()
    @IsOptional()
    photo_url?: string;
}

export class TableUserDto {
    @ApiProperty({ example: 1, description: 'ID записи' })
    @IsInt()
    id: number;

    @ApiProperty({ type: UserResponseDto, description: 'Пользователь' })
    user: UserResponseDto;

    @ApiProperty({ example: '2023-10-01T12:00:00Z', description: 'Время присоединения' })
    @IsDate()
    joinedAt: Date;

    @ApiProperty({ example: true, description: 'Первая ставка' })
    @IsBoolean()
    isFirstBet: boolean;
}

export class TablePrizeDto {
    @ApiProperty({ example: 1, description: 'ID приза' })
    @IsInt()
    id: number;

    @ApiProperty({ example: 1, description: 'ID стола' })
    @IsInt()
    tableId: number;

    @ApiProperty({ example: 1, description: 'ID пользователя', nullable: true })
    @IsInt()
    @IsOptional()
    userId: number | null;

    @ApiProperty({ type: UserResponseDto, description: 'Пользователь', nullable: true })
    user: UserResponseDto | null;

    @ApiProperty({ example: 1, description: 'Позиция в призовом списке' })
    @IsInt()
    position: number;

    @ApiProperty({ example: 100, description: 'Сумма приза' })
    @IsNumber()
    amount: number;

    @ApiProperty({ example: '2023-10-01T12:00:00Z', description: 'Время создания' })
    @IsDate()
    createdAt: Date;
}

export class TableResponseDto {
    @ApiProperty({ example: 1, description: 'ID стола' })
    @IsInt()
    id: number;

    @ApiProperty({ enum: TableType, example: TableType.LINEAR, description: 'Тип стола' })
    @IsEnum(TableType)
    type: TableType;

    @ApiProperty({ example: 5, description: 'Входная ставка' })
    @IsNumber()
    entryFee: number;

    @ApiProperty({ example: 100, description: 'Призовой фонд' })
    @IsNumber()
    prizeFund: number;

    @ApiProperty({ enum: TableStatus, example: TableStatus.OPEN, description: 'Статус стола' })
    @IsEnum(TableStatus)
    status: TableStatus;

    @ApiProperty({ example: 'https://t.me/bot?start=table_abc123', description: 'Ссылка для приглашения' })
    @IsString()
    inviteLink: string;

    @ApiProperty({ example: '2023-10-01T12:00:00Z', description: 'Время создания' })
    @IsDate()
    createdAt: Date;

    @ApiProperty({ example: '2023-10-01T12:00:00Z', description: 'Время обновления' })
    @IsDate()
    updatedAt: Date;

    @ApiProperty({ type: [TableUserDto], description: 'Участники стола' })
    tableUsers: TableUserDto[];

    @ApiProperty({ type: [TablePrizeDto], description: 'Призы стола' })
    tablePrizes: TablePrizeDto[];
}
