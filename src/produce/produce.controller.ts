import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseFloatPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ProduceService } from './produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { ProduceCategory, ProduceStatus } from './entities/produce.entity';

@Controller('produce')
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

  @Post()
  create(@Body() createProduceDto: CreateProduceDto) {
    return this.produceService.create(createProduceDto);
  }

  @Get()
  findAll(
    @Query('farmer_id') farmer_id?: string,
    @Query('farm_id') farm_id?: string,
    @Query('status') status?: ProduceStatus,
    @Query('produce_category') produce_category?: ProduceCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.produceService.findAll({
      farmer_id,
      farm_id,
      status,
      produce_category,
      page,
      limit,
    });
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
    @Query('radius', new DefaultValuePipe(10), ParseFloatPipe) radius = 10,
  ) {
    return this.produceService.findNearby(lat, lon, radius);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProduceDto: UpdateProduceDto) {
    return this.produceService.update(id, updateProduceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produceService.remove(id);
  }
} 