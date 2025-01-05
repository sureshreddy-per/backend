import { Controller, Get, Post, Put, Delete, Body, Param, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProduceService } from './produce.service';
import { ProduceFilterDto } from './dto/produce-filter.dto';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Produce')
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
  async create(@Body() createProduceDto: CreateProduceDto) {
    return this.produceService.create(createProduceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get produce listings with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered produce listings with pagination',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
              description: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              distance: { type: 'number', description: 'Distance in kilometers (if location provided)' },
              farmer: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              qualityAssessment: {
                type: 'object',
                properties: {
                  grade: { type: 'string' },
                  metadata: { type: 'object' }
                }
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number' },
        hasMore: { type: 'boolean' }
      }
    }
  })
  async findAll(@Query(new ValidationPipe({ transform: true })) filters: ProduceFilterDto) {
    return this.produceService.findAll(filters);
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
  async update(@Param('id') id: string, @Body() updateProduceDto: UpdateProduceDto) {
    return this.produceService.update(id, updateProduceDto);
  }

  @Delete(':id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Delete a produce listing' })
  @ApiResponse({
    status: 200,
    description: 'The produce listing has been successfully deleted'
  })
  async remove(@Param('id') id: string) {
    return this.produceService.remove(id);
  }
} 