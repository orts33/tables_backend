import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
    @IsNumber()
    amount: number;

    @IsString()
    currency: string = 'TONCOIN';

    @IsString()
    description: string;

    @IsString()
    userId?: number;

    @IsOptional()
    @IsString()
    callbackUrl?: string;
}
