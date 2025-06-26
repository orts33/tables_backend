import { Controller, Get, Post, Body, Param, BadRequestException, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import {RegisterUserDto} from "../table/table.dto";

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('auth/telegram')
    @ApiOperation({ summary: 'Авторизация через Telegram Mini App' })
    @ApiBody({
        description: 'initData из Telegram WebApp',
        schema: {
            type: 'object',
            properties: {
                initData: { type: 'string', example: 'query_id=AAH...&user=%7B%22id%22%3A123456789%2C...%7D&auth_date=169...' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Пользователь авторизован или зарегистрирован',
        type: UserResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    async authTelegram(@Body('initData') initData: string) {
        if (!initData) {
            throw new BadRequestException('initData отсутствует');
        }
        return await this.userService.authTelegram(initData);
    }

    @Get('leaderboard')
    @ApiOperation({ summary: 'Получить таблицу лидеров' })
    @ApiQuery({
        name: 'limit',
        description: 'Количество лидеров для возврата',
        required: false,
        type: Number,
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Список лидеров',
        type: [UserResponseDto],
    })
    @ApiResponse({ status: 400, description: 'Неверный параметр limit' })
    async getLeaderboard(@Query('limit') limit: string = '10') {
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            throw new BadRequestException('Неверный параметр limit');
        }
        return await this.userService.getLeaderboard(parsedLimit);
    }

    @Get(':telegramId')
    @ApiOperation({ summary: 'Получить данные пользователя' })
    @ApiParam({
        name: 'telegramId',
        description: 'Telegram ID пользователя',
        example: '123456789',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Данные пользователя',
        type: UserResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    getUser(@Param('telegramId') telegramId: string) {
        return this.userService.getUser(telegramId);
    }

    @Post()
    @ApiOperation({ summary: 'Создать или обновить пользователя (устаревший)' })
    @ApiBody({
        description: 'Данные пользователя',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 201,
        description: 'Пользователь создан или обновлён',
        type: UserResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    createOrUpdateUser(@Body() data: UserResponseDto) {
        return this.userService.createOrUpdateUser(data);
    }

    @Post('register')
    async register(@Body() data: RegisterUserDto): Promise<UserResponseDto> {
        return this.userService.registerUser(data);
    }


}
