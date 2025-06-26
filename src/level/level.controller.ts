// level.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { LevelService } from './level.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LevelResponseDto, LevelRewardDto } from './level.dto';

@ApiTags('Levels')
@Controller('levels')
export class LevelController {
    constructor(private readonly levelService: LevelService) {}

    @Get(':telegramId')
    @ApiOperation({ summary: 'Получить информацию об уровне пользователя' })
    @ApiParam({ name: 'telegramId', description: 'Telegram ID пользователя', example: '123456789' })
    @ApiResponse({ status: 200, description: 'Данные уровня', type: LevelResponseDto })
    getLevel(@Param('telegramId') telegramId: string) {
        return this.levelService.getLevel(telegramId);
    }

    @Get(':telegramId/rewards')
    @ApiOperation({ summary: 'Получить бонусы за уровни' })
    @ApiParam({ name: 'telegramId', description: 'Telegram ID пользователя', example: '123456789' })
    @ApiResponse({ status: 200, description: 'Список бонусов', type: [LevelRewardDto] })
    getRewards(@Param('telegramId') telegramId: string) {
        return this.levelService.getRewards(telegramId);
    }
}
