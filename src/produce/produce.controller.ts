import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProduceService } from './produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProduceStatus, VerifiedStatus, Produce } from './entities/produce.entity';
import { User } from '../auth/entities/user.entity';

@ApiTags('Produce')
@ApiBearerAuth()
@Controller('produce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

  @Post()
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Create produce listing',
    description: 'Creates a new produce listing for a farmer. Only accessible by users with the FARMER role.'
  })
  @ApiBody({
    type: CreateProduceDto,
    description: 'Produce listing details including type, quantity, price, and other specifications'
  })
  @ApiResponse({
    status: 201,
    description: 'The produce listing has been successfully created',
    type: Produce
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid produce data or user is not a farmer'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the FARMER role'
  })
  async create(
    @Body() createProduceDto: CreateProduceDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.produceService.create(createProduceDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all produce listings',
    description: 'Retrieves a filtered and paginated list of all produce listings.'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'type',
    description: 'Filter by produce type',
    required: false,
    type: String
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by produce status',
    required: false,
    enum: ProduceStatus
  })
  @ApiQuery({
    name: 'verifiedStatus',
    description: 'Filter by verification status',
    required: false,
    enum: VerifiedStatus
  })
  @ApiQuery({
    name: 'minQuantity',
    description: 'Minimum quantity filter',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'maxQuantity',
    description: 'Maximum quantity filter',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude for location-based search',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude for location-based search',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in kilometers',
    required: false,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'List of produce listings retrieved successfully',
    type: Produce,
    isArray: true
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('status') status?: ProduceStatus,
    @Query('verifiedStatus') verifiedStatus?: VerifiedStatus,
    @Query('minQuantity') minQuantity?: number,
    @Query('maxQuantity') maxQuantity?: number,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radius?: number,
  ) {
    const filters: any = {};

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (verifiedStatus) filters.verifiedStatus = verifiedStatus;
    if (minQuantity) filters.minQuantity = minQuantity;
    if (maxQuantity) filters.maxQuantity = maxQuantity;
    if (lat && lng && radius) {
      filters.location = { lat, lng, radius };
    }

    return this.produceService.findAll(page, limit, filters);
  }

  @Get('my-listings')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Get own produce listings',
    description: 'Retrieves all produce listings for the authenticated farmer.'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Farmer\'s produce listings retrieved successfully',
    type: Produce,
    isArray: true
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the FARMER role'
  })
  async findByUser(
    @CurrentUser() user: { id: string; role: Role },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.produceService.findByUser(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get produce by ID',
    description: 'Retrieves detailed information about a specific produce listing.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the produce listing',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Produce listing retrieved successfully',
    type: Produce
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Produce listing does not exist'
  })
  async findOne(@Param('id') id: string) {
    return this.produceService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Update produce listing',
    description: 'Updates an existing produce listing. Farmers can only update their own listings.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the produce listing to update',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateProduceDto,
    description: 'Updated produce listing information'
  })
  @ApiResponse({
    status: 200,
    description: 'Produce listing updated successfully',
    type: Produce
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update this listing'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Produce listing does not exist'
  })
  async update(
    @Param('id') id: string,
    @Body() updateProduceDto: UpdateProduceDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.produceService.update(id, updateProduceDto, user.id);
  }

  @Put(':id/status')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Update produce status',
    description: 'Updates the status of a produce listing. Farmers can only update their own listings.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the produce listing',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ProduceStatus),
          description: 'New status for the produce listing'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Produce status updated successfully',
    type: Produce
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update this listing'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Produce listing does not exist'
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProduceStatus,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.produceService.updateStatus(id, status, user.id);
  }

  @Put(':id/quality')
  @Roles(Role.ADMIN, Role.QUALITY_INSPECTOR)
  @ApiOperation({
    summary: 'Update produce quality',
    description: 'Updates the quality grade and verification status of a produce listing. Only accessible by administrators and quality inspectors.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the produce listing',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['qualityId', 'verifiedStatus'],
      properties: {
        qualityId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the quality grade to assign'
        },
        verifiedStatus: {
          type: 'string',
          enum: Object.values(VerifiedStatus),
          description: 'New verification status'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Quality grade updated successfully',
    type: Produce
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Produce listing or quality grade not found'
  })
  async updateQualityGrade(
    @Param('id') id: string,
    @Body('qualityId') qualityId: string,
    @Body('verifiedStatus') verifiedStatus: VerifiedStatus,
    @CurrentUser() user: User,
  ) {
    return this.produceService.updateQualityGrade(id, qualityId, verifiedStatus, user.id);
  }
} 