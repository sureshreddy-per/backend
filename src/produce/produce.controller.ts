import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProduceService } from './produce.service';
import { ProduceFilterDto } from './dto/produce-filter.dto';

@ApiTags('Produce')
@Controller('produce')
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

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
} 