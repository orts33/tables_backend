import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

@Controller('api/admin/auth')
export class AdminAuthController {
    constructor(private readonly authService: AdminAuthService) {}

    @Post('login')
    login(@Body() dto: { email: string; password: string }) {
        return this.authService.login(dto.email, dto.password);
    }
}
