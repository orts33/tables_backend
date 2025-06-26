import { IsString, IsNumber } from 'class-validator';

export class TransferDto {
    @IsString()
    telegramId: string;

    @IsNumber()
    amount: number;

    @IsString()
    comment: string;
}
