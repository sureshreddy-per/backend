import { Controller, Get, Post, Body, Put, Delete, Param, Query, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProduceService } from './produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { ProduceFilterDto } from './dto/produce-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetFarmer } from '../auth/decorators/get-farmer.decorator';
import { Role } from '../auth/enums/role.enum';
import { Farmer } from '../farmers/entities/farmer.entity';

@ApiTags('Produce')
@ApiBearerAuth()
@Controller('produce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

  @Post()
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Create a new produce listing' })
  @ApiResponse({
    status: 201,
    description: 'The produce listing has been successfully created'
  })
  async create(@Request() req, @Body() createProduceDto: CreateProduceDto) {
    const farmer = await this.produceService.getFarmerByUserId(req.user.id);
    return this.produceService.create(farmer.id, createProduceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all produce listings' })
  @ApiResponse({
    status: 200,
    description: 'Returns all produce listings'
  })
  async findAll(@Query(new ValidationPipe({ transform: true })) filters: ProduceFilterDto) {
    return this.produceService.findAll(filters);
  }

  @Get('my-listings')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get own produce listings' })
  @ApiResponse({
    status: 200,
    description: 'Returns the farmer\'s produce listings'
  })
  async getMyListings(@Request() req) {
    const farmer = await this.produceService.getFarmerByUserId(req.user.id);
    return this.produceService.findByFarmerId(farmer.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a produce listing by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the produce listing'
  })
  async findOne(@Param('id') id: string) {
    return this.produceService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Update a produce listing' })
  @ApiResponse({
    status: 200,
    description: 'The produce listing has been successfully updated'
  })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProduceDto: UpdateProduceDto
  ) {
    const farmer = await this.produceService.getFarmerByUserId(req.user.id);
    return this.produceService.update(id, farmer.id, updateProduceDto);
  }

  @Delete(':id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Delete a produce listing' })
  @ApiResponse({
    status: 200,
    description: 'The produce listing has been successfully deleted'
  })
  async remove(@Request() req, @Param('id') id: string) {
    const farmer = await this.produceService.getFarmerByUserId(req.user.id);
    return this.produceService.remove(id, farmer.id);
  }
} 