import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { QualityService } from './quality.service';
import { CreateQualityAssessmentDto } from './dto/create-quality-assessment.dto';
import { QualityAssessment } from './entities/quality-assessment.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  create(@Body() createQualityDto: CreateQualityAssessmentDto): Promise<QualityAssessment> {
    return this.qualityService.create(createQualityDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<QualityAssessment>> {
    return this.qualityService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QualityAssessment> {
    return this.qualityService.findOne(id);
  }
} 