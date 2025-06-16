import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, JoinTableDto, RegisterUserDto, TableResponseDto } from './table.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Tables')
@Controller('tables')
export class TableController {
    constructor(private readonly tableService: TableService) {}

    @Post()
    @ApiOperation({ summary: 'Создать новый игровой стол' })
    @ApiBody({ type: CreateTableDto })
    @ApiResponse({
        status: 201,
        description: 'Стол успешно создан',
        type: TableResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Некорректные данные' })
    create(@Body() createTableDto: CreateTableDto) {
        return this.tableService.create(createTableDto);
    }

    @Get()
    @ApiOperation({ summary: 'Получить список всех столов' })
    @ApiResponse({
        status: 200,
        description: 'Список столов',
        type: [TableResponseDto],
    })
    getTables() {
        return this.tableService.getTables();
    }

    @Get('invite/:inviteLink')
    @ApiOperation({ summary: 'Получить стол по пригласительной ссылке' })
    @ApiParam({
        name: 'inviteLink',
        description: 'Ссылка для приглашения',
        example: 'https://t.me/BotName?start=table_abc123',
    })
    @ApiResponse({
        status: 200,
        description: 'Данные стола',
        type: TableResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Стол не найден или закрыт' })
    getTableByInviteLink(@Param('inviteLink') inviteLink: string) {
        return this.tableService.getTableByInviteLink(inviteLink);
    }

    @Post('join')
    @HttpCode(200)
    @ApiOperation({ summary: 'Присоединиться к столу' })
    @ApiBody({ type: JoinTableDto })
    @ApiResponse({
        status: 200,
        description: 'Пользователь присоединился к столу',
        type: TableResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Стол не найден, полон или пользователь уже присоединился' })
    joinTable(@Body() joinTableDto: JoinTableDto) {
        return this.tableService.joinTable(joinTableDto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Зарегистрировать пользователя' })
    @ApiBody({ type: RegisterUserDto })
    @ApiResponse({
        status: 201,
        description: 'Пользователь зарегистрирован',
        type: RegisterUserDto,
    })
    @ApiResponse({ status: 400, description: 'Некорректные данные' })
    registerUser(@Body() registerUserDto: RegisterUserDto) {
        return this.tableService.registerUser(registerUserDto);
    }

}
