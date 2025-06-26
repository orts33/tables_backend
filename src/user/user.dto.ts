import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class UserResponseDto {

  @ApiProperty({ example: '1', description: 'ID пользователя' })
  @IsString()
  id?: number;

  @ApiProperty({ example: '1', description: 'Реферал' })
  @IsString()
  referrerId?: string | null;

  @ApiProperty({ example: '123456789', description: 'Telegram ID пользователя' })
  @IsString()
  telegramId: string;

  @ApiProperty({ example: 'Иван', description: 'Имя пользователя', required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ example: 'Иванов', description: 'Фамилия пользователя', required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: 'ivanov', description: 'Имя пользователя в Telegram', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', description: 'URL фото профиля', required: false })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiProperty({ example: 100.5, description: 'Баланс пользователя' })
  @IsNumber()
  balance: number;

  @ApiProperty({ example: 10, description: 'Общее количество игр' })
  @IsInt()
  totalGames: number;

  @ApiProperty({ example: 5, description: 'Количество выигранных столов' })
  @IsInt()
  wonTables: number;

  @ApiProperty({ example: 3, description: 'Уровень пользователя' })
  @IsInt()
  level: number;

  @ApiProperty({ example: 500, description: 'Очки опыта' })
  @IsInt()
  xp: number;

  @ApiProperty({ example: 1, description: 'ID клана', required: false })
  @IsInt()
  @IsOptional()
  clanId?: number;
}

export interface RegisterUserDto {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
  referrerId?: string | null;
}
