import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
    @IsNumber()
    amount: number;

    @IsString()
    currency: string = 'TONCOIN';

    @IsString()
    description: string;

    @IsString()
    telegramId?: string;

    @IsString()
    userId?: number;

    @IsString()
    link?: string;

    @IsNumber()
    paymentId?: number;

    @IsOptional()
    @IsString()
    callbackUrl?: string;
}
