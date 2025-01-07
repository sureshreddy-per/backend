import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseFloatPipe } from '@nestjs/common';
import { InspectorsService } from './inspectors.service';
import { CreateInspectorDto } from './dto/create-inspector.dto';
import { UpdateInspectorDto } from './dto/update-inspector.dto';

@Controller('inspectors')
export class InspectorsController {
  constructor(private readonly inspectorsService: InspectorsService) {}

  @Post()
  create(@Body() createInspectorDto: CreateInspectorDto) {
    return this.inspectorsService.create(createInspectorDto);
  }

  @Get()
  findAll() {
    return this.inspectorsService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radiusKm: number,
  ) {
    return this.inspectorsService.findNearby(lat, lng, radiusKm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInspectorDto: UpdateInspectorDto) {
    return this.inspectorsService.update(id, updateInspectorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectorsService.remove(id);
  }
} 