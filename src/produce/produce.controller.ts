import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFiles, ParseEnumPipe, DefaultValuePipe, ParseIntPipe, ParseFloatPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ProduceService } from './produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GeospatialService } from '../common/services/geospatial.service';
import { ProduceCategory, ProduceStatus, Produce } from './entities/produce.entity';
import { PaginatedResponse } from './interfaces/paginated-response.interface';
import { PaginatedProduceResponseDto } from './dto/paginated-response.dto';

const SORTABLE_FIELDS: (keyof Produce)[] = [
  'created_at',
  'updated_at',
  'price_per_unit',
  'quantity',
  'name',
];

@ApiTags('Produce')
@ApiBearerAuth()
@Controller('produce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProduceController {
  constructor(
    private readonly produceService: ProduceService,
    private readonly geospatialService: GeospatialService,
  ) {}

  @Post()
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Create new produce listing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Produce listing created successfully', type: Produce })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
  ]))
  async create(
    @Body() createProduceDto: CreateProduceDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[] }
  ): Promise<Produce> {
    return this.produceService.create(createProduceDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all produce listings with filters' })
  @ApiQuery({ name: 'category', required: false, enum: ProduceCategory, description: 'Filter by produce category' })
  @ApiQuery({ name: 'status', required: false, enum: ProduceStatus, description: 'Filter by produce status' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Latitude for location-based search' })
  @ApiQuery({ name: 'lon', required: false, type: Number, description: 'Longitude for location-based search' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in kilometers' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, enum: SORTABLE_FIELDS, description: 'Sort by field', example: 'created_at' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of produce items', type: PaginatedProduceResponseDto })
  async findAll(
    @Query('category') category?: ProduceCategory,
    @Query('status') status?: ProduceStatus,
    @Query('minPrice', ParseIntPipe) minPrice?: number,
    @Query('maxPrice', ParseIntPipe) maxPrice?: number,
    @Query('lat', ParseFloatPipe) lat?: number,
    @Query('lon', ParseFloatPipe) lon?: number,
    @Query('radius', ParseIntPipe) radius?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('sortBy', new DefaultValuePipe('created_at')) sortBy: keyof Produce = 'created_at',
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResponse<Produce>> {
    if (sortBy && !SORTABLE_FIELDS.includes(sortBy as keyof Produce)) {
      sortBy = 'created_at';
    }

    return this.produceService.findAll({
      category,
      status,
      minPrice,
      maxPrice,
      location: lat && lon ? { lat, lon, radius: radius || 10 } : undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('nearby/:lat/:lon/:radius')
  @ApiOperation({ summary: 'Find nearby produce' })
  @ApiParam({ name: 'lat', type: Number, description: 'Latitude' })
  @ApiParam({ name: 'lon', type: Number, description: 'Longitude' })
  @ApiParam({ name: 'radius', type: Number, description: 'Search radius in kilometers' })
  @ApiResponse({ status: 200, description: 'Returns list of nearby produce', type: [Produce] })
  async findNearby(
    @Param('lat', ParseFloatPipe) lat: number,
    @Param('lon', ParseFloatPipe) lon: number,
    @Param('radius', ParseIntPipe) radius: number
  ): Promise<Produce[]> {
    return this.produceService.findNearby(lat, lon, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get produce by ID' })
  @ApiParam({ name: 'id', description: 'Produce ID' })
  @ApiResponse({ status: 200, description: 'Returns produce details', type: Produce })
  @ApiResponse({ status: 404, description: 'Produce not found' })
  async findOne(@Param('id') id: string): Promise<Produce> {
    return this.produceService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Update produce listing' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Produce ID' })
  @ApiResponse({ status: 200, description: 'Produce updated successfully', type: Produce })
  @ApiResponse({ status: 404, description: 'Produce not found' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
  ]))
  async update(
    @Param('id') id: string,
    @Body() updateProduceDto: UpdateProduceDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[] }
  ): Promise<Produce> {
    return this.produceService.update(id, updateProduceDto, files);
  }

  @Delete(':id')
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Delete produce listing' })
  @ApiParam({ name: 'id', description: 'Produce ID' })
  @ApiResponse({ status: 200, description: 'Produce deleted successfully' })
  @ApiResponse({ status: 404, description: 'Produce not found' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.produceService.remove(id);
  }
} 