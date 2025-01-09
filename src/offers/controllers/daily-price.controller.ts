import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { DailyPriceService } from '../services/daily-price.service';
import { CreateDailyPriceDto } from '../dto/create-daily-price.dto';
import { UpdateDailyPriceDto } from '../dto/update-daily-price.dto';
import { DailyPrice } from '../entities/daily-price.entity';
import { ProduceCategory } from '../../produce/entities/produce.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('daily-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyPriceController {
  constructor(private readonly dailyPriceService: DailyPriceService) {}

  @Post()
  @Roles(UserRole.BUYER)
  async create(@Body() createDailyPriceDto: CreateDailyPriceDto): Promise<DailyPrice> {
    return this.dailyPriceService.create(createDailyPriceDto);
  }

  @Get('active')
  @Roles(UserRole.BUYER)
  async findAllActive(@Query('buyer_id') buyer_id: string): Promise<DailyPrice[]> {
    return this.dailyPriceService.findAllActive(buyer_id);
  }

  @Get('active/:category')
  @Roles(UserRole.BUYER, UserRole.FARMER)
  async findActive(
    @Query('buyer_id') buyer_id: string,
    @Param('category') category: ProduceCategory
  ): Promise<DailyPrice> {
    const price = await this.dailyPriceService.findActive(buyer_id, category);
    return price;
  }

  @Put(':id')
  @Roles(UserRole.BUYER)
  async update(
    @Param('id') id: string,
    @Body() updateDailyPriceDto: UpdateDailyPriceDto
  ): Promise<DailyPrice> {
    return this.dailyPriceService.update(id, updateDailyPriceDto);
  }

  @Delete(':id')
  @Roles(UserRole.BUYER)
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.dailyPriceService.deactivate(id);
  }
} 