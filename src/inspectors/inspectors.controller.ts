import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InspectorsService } from './inspectors.service';
import { Inspector } from './entities/inspector.entity';

@Controller('inspectors')
export class InspectorsController {
  constructor(private readonly inspectorsService: InspectorsService) {}

  @Post()
  create(@Body() createInspectorDto: Partial<Inspector>) {
    return this.inspectorsService.create(createInspectorDto);
  }

  @Get()
  findAll() {
    return this.inspectorsService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radiusKm: number = 50,
  ) {
    return this.inspectorsService.findNearby(lat, lng, radiusKm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectorDto: Partial<Inspector>,
  ) {
    return this.inspectorsService.update(id, updateInspectorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectorsService.remove(id);
  }
} 