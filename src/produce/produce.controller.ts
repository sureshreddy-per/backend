import { Controller, Get, Post, Body, Param, Put, Delete, Query, Req } from '@nestjs/common';
import { ProduceService } from './produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';

@Controller('produce')
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

  @Post()
  create(@Body() createProduceDto: CreateProduceDto) {
    return this.produceService.create(createProduceDto);
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    return this.produceService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produceService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProduceDto: UpdateProduceDto) {
    return this.produceService.update(id, updateProduceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produceService.remove(id);
  }
} 