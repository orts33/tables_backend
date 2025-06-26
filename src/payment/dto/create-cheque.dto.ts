import { IsNumber, IsString } from 'class-validator';

export class CreateChequeDto {
    @IsNumber()
    amount: number;

    @IsNumber()
    count: number;

    @IsString()
    description: string;
}
