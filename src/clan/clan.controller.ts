import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';
import { ClanService } from './clan.service';
import { CreateClanDto, JoinClanDto, ClanResponseDto } from './clan.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Clans')
@Controller('clans')
export class ClanController {
    constructor(private readonly clanService: ClanService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список всех кланов' })
    @ApiResponse({
        status: 200,
        description: 'Список кланов',
        type: [ClanResponseDto],
    })
    getClans() {
        return this.clanService.getClans();
    }

    @Post()
    @ApiOperation({ summary: 'Создать новый клан' })
    @ApiBody({ type: CreateClanDto })
    @ApiResponse({
        status: 201,
        description: 'Клан успешно создан',
        type: ClanResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Некорректные данные или недостаточно игр' })
    createClan(@Body() createClanDto: CreateClanDto) {
        return this.clanService.createClan(createClanDto.name, createClanDto.telegramId);
    }

    @Post(':id/join')
    @HttpCode(200)
    @ApiOperation({ summary: 'Вступить в клан' })
    @ApiParam({
        name: 'id',
        description: 'ID клана',
        example: 1,
        type: Number,
    })
    @ApiBody({ type: JoinClanDto })
    @ApiResponse({
        status: 200,
        description: 'Пользователь вступил в клан',
        type: ClanResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Клан не найден или пользователь уже в клане' })
    joinClan(@Param('id') id: string, @Body() joinClanDto: JoinClanDto) {
        return this.clanService.joinClan(parseInt(id), joinClanDto.telegramId);
    }
}
