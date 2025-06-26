import {Controller, Get, Post, Body, Param, HttpCode, NotFoundException} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, JoinTableDto, RegisterUserDto, TableResponseDto } from './table.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Столы')
@Controller('tables')
export class TableController {
    constructor(private readonly tableService: TableService) {}

    @Post()
    @ApiOperation({ summary: 'Создать новый игровой стол' })
    @ApiBody({ type: CreateTableDto, description: 'Данные для создания стола' })
    @ApiResponse({
        status: 201,
        description: 'Стол успешно создан',
        type: TableResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Некорректные данные или стол уже существует' })
    create(@Body() createTableDto: CreateTableDto) {
        return this.tableService.create(createTableDto);
    }

    @Get()
    @ApiOperation({ summary: 'Получить список всех столов' })
    @ApiResponse({
        status: 200,
        description: 'Список всех столов',
        type: [TableResponseDto],
    })
    getTables() {
        return this.tableService.getTables();
    }

    @Get('invite/:inviteLink')
    @ApiOperation({ summary: 'Получить стол по пригласительной ссылке' })
    @ApiParam({
        name: 'inviteLink',
        description: 'Пригласительная ссылка на стол',
        example: 'https://t.me/BotName?start=table_abc123',
    })
    @ApiResponse({
        status: 200,
        description: 'Данные открытого стола',
        type: TableResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Стол не найден или закрыт' })
    getTableByInviteLink(@Param('inviteLink') inviteLink: string) {
        return this.tableService.getTableByInviteLink(inviteLink);
    }

    @Post('join')
    @HttpCode(200)
    @ApiOperation({ summary: 'Присоединиться к столу' })
    @ApiBody({ type: JoinTableDto, description: 'Данные для присоединения к столу' })
    @ApiResponse({
        status: 200,
        description: 'Пользователь успешно присоединился к столу',
        type: TableResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Стол не найден, полон или пользователь уже присоединился',
    })
    joinTable(@Body() joinTableDto: JoinTableDto) {
        return this.tableService.joinTable(joinTableDto);
    }

    // @Post('register')
    // @ApiOperation({ summary: 'Зарегистрировать или обновить пользователя' })
    // @ApiBody({ type: RegisterUserDto, description: 'Данные пользователя' })
    // @ApiResponse({
    //     status: 201,
    //     description: 'Пользователь успешно зарегистрирован или обновлён',
    //     type: RegisterUserDto,
    // })
    // @ApiResponse({ status: 400, description: 'Некорректные данные' })
    // registerUser(@Body() registerUserDto: RegisterUserDto) {
    //     return this.tableService.registerUser(registerUserDto);
    // }

    @Get(':id/history')
    @ApiOperation({ summary: 'Получить историю стола' })
    @ApiParam({
        name: 'id',
        description: 'ID стола',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'История стола с участниками и призами',
    })
    @ApiResponse({ status: 400, description: 'Стол не найден' })
    getTableHistory(@Param('id') id: string) {
        return this.tableService.getTableHistory(parseInt(id));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить данные стола по ID' })
    @ApiParam({
        name: 'id',
        description: 'ID стола',
        example: 1,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: 'Данные стола',
        type: TableResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Стол не найден' })
    async getTableById(@Param('id') id: string) {
        const tableId = parseInt(id);
        if (isNaN(tableId)) {
            throw new NotFoundException('Некорректный ID стола');
        }
        const table = await this.tableService.getTableById(tableId);
        if (!table) {
            throw new NotFoundException('Стол не найден');
        }
        return table;
    }
}

