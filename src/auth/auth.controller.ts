import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() body: { telegramId: string; password: string }) {
        try {
            return await this.authService.login(body.telegramId, body.password);
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }
}
