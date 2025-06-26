import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateInvoiceDto} from './dto/create-invoice.dto';
import { TransferDto } from './dto/transfer.dto';
import { CreateChequeDto } from './dto/create-cheque.dto';
import { verifySignature } from './utils/verify-signature.util';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('invoice')
    createInvoice(@Body() dto: CreateInvoiceDto) {
        return this.paymentsService.createInvoice(dto, dto.userId);
    }

    @Get('invoices/:id')
    getInvoice(@Param('id') id: string) {
        return this.paymentsService.getInvoice(id);
    }

    @Post('transfer')
    transfer(@Body() dto: TransferDto) {
        return this.paymentsService.transfer(dto);
    }

    @Post('cheque')
    createCheque(@Body() dto: CreateChequeDto) {
        return this.paymentsService.createCheque(dto);
    }

    @Post('webhook')
    handleWebhook(@Body() body: any, @Headers('x-signature') signature: string) {
        if (!verifySignature(body, signature)) {
            throw new BadRequestException('Invalid webhook signature');
        }

        return this.paymentsService.handleWebhook(body);
    }
}
