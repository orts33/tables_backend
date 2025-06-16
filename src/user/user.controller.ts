import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

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
}
