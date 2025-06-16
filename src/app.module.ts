import { Module } from '@nestjs/common';
import { TableModule } from './table/table.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClanModule } from './clan/clan.module';
import { UserModule } from './user/user.module';
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true, // Делаем ConfigModule глобальным
        envFilePath: '.env',
      }),
      TableModule, PrismaModule, ClanModule, UserModule],
})
export class AppModule {}
