import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DailyPriceService } from '../services/daily-price.service';
import { DailyPrice } from '../entities/daily-price.entity';
import { CreateDailyPriceDto } from '../services/daily-price.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Daily Prices')
@Controller('daily-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyPriceController {
  constructor(private readonly dailyPriceService: DailyPriceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new daily price' })
  @ApiResponse({ status: 201, description: 'Daily price created successfully' })
  async create(@Body() createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    return this.dailyPriceService.create(createDailyPriceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all daily prices' })
  @ApiResponse({ status: 200, description: 'Returns all daily prices' })
  async findAll(): Promise<DailyPrice[]> {
    return this.dailyPriceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a daily price by id' })
  @ApiResponse({ status: 200, description: 'Returns the daily price' })
  async findOne(@Param('id') id: string): Promise<DailyPrice> {
    return this.dailyPriceService.findOne(id);
  }

  @Get('produce/:name')
  @ApiOperation({ summary: 'Get daily prices by produce name' })
  @ApiResponse({ status: 200, description: 'Returns daily prices for the specified produce' })
  async findByProduceName(@Param('name') name: string): Promise<DailyPrice[]> {
    return this.dailyPriceService.findByProduceName(name);
  }

  @Get('produce/:name/latest')
  @ApiOperation({ summary: 'Get latest daily price by produce name' })
  @ApiResponse({ status: 200, description: 'Returns the latest daily price for the specified produce' })
  async findLatestByProduceName(@Param('name') name: string): Promise<DailyPrice | null> {
    return this.dailyPriceService.findLatestByProduceName(name);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a daily price' })
  @ApiResponse({ status: 200, description: 'Daily price updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<DailyPrice>,
  ): Promise<DailyPrice> {
    return this.dailyPriceService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a daily price' })
  @ApiResponse({ status: 200, description: 'Daily price deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.dailyPriceService.remove(id);
  }
}
