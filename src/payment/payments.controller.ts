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
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { TransferDto } from './dto/transfer.dto';
import { CreateChequeDto } from './dto/create-cheque.dto';
import { verifySignature } from './utils/verify-signature.util';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        @InjectBot() private readonly bot: Telegraf,
    ) {}

    @Post('invoice')
    async createInvoice(@Body() dto: CreateInvoiceDto) {
        return this.paymentsService.createInvoice(dto, +dto.telegramId);
    }

    @Get('invoices/:id')
    async getInvoice(@Param('id') id: string) {
        return this.paymentsService.getInvoice(id);
    }

    @Get('invoices/last/:telegramId')
    async getLastUserInvoices(@Param('telegramId') telegramId: string) {
        return this.paymentsService.getLastUserInvoices(telegramId);
    }

    @Get('invoices/pending/:telegramId')
    async getPendingUserInvoices(@Param('telegramId') telegramId: string) {
        return this.paymentsService.getPendingUserInvoices(telegramId);
    }

    @Post('notify')
    async notifyUser(@Body() dto: { telegramId: string; invoiceId: string; paymentUrl: string; amount: number }) {
        await this.paymentsService.notifyUser(dto.telegramId, dto.invoiceId, dto.paymentUrl, dto.amount);
        return { ok: true };
    }

    @Post('transfer')
    async transfer(@Body() dto: TransferDto) {
        return this.paymentsService.transfer(dto);
    }

    @Post('cheque')
    async createCheque(@Body() dto: CreateChequeDto) {
        return this.paymentsService.createCheque(dto);
    }

    @Post('webhook')
    async handleWebhook(@Body() body: any, @Headers('x-signature') signature: string) {
        if (!verifySignature(body, signature)) {
            throw new BadRequestException('Invalid webhook signature');
        }
        return this.paymentsService.handleWebhook(body);
    }
}
