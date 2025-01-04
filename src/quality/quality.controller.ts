import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { QualityService } from './quality.service';
import { CreateQualityDto } from './dto/create-quality.dto';

@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  create(@Body() createQualityDto: CreateQualityDto) {
    return this.qualityService.create(createQualityDto);
  }

  @Get()
  async findAll() {
    const result = await this.qualityService.findAll();
    return result.items;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qualityService.findOne(id);
  }

  @Put(':id/finalize')
  finalizeQualityAssessment(
    @Param('id') id: string,
    @Body('finalPrice') finalPrice: number
  ) {
    return this.qualityService.finalizeQualityAssessment(id, finalPrice);
  }
} 