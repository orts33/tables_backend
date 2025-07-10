import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthService, PrismaService],
})
export class AdminAuthModule {}
