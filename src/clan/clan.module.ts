import { Module } from '@nestjs/common';
import { ClanService } from './clan.service';
import { ClanController } from './clan.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    providers: [ClanService, PrismaService],
    controllers: [ClanController],
})
export class ClanModule {}
