import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

const secret = new ConfigService().get('XROCKET_WEBHOOK_SECRET');

export function verifySignature(body: any, signature: string): boolean {
    const expected = createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');

    return expected === signature;
}
