import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { TableService } from './table/table.service';

@Injectable()
export class Bootstrap implements OnApplicationBootstrap {
    constructor(private readonly tableService: TableService) {}

    async onApplicationBootstrap() {
        await this.tableService.initTables();
    }
}
