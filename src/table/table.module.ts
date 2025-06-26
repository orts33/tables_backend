import { Module } from '@nestjs/common';
import { TableService } from './table.service';
import { TableController } from './table.controller';
import { PrismaModule } from '../prisma/prisma.module';
import {UserModule} from "../user/user.module";

@Module({
    imports: [PrismaModule, UserModule],
    controllers: [TableController],
    providers: [TableService],
})
export class TableModule {}
