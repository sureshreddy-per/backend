import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, ParseBoolPipe, ParseIntPipe, DefaultValuePipe, Type } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FarmersService } from './farmers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Farmer } from './entities/farmer.entity';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto, TransactionDto, BuyerDto } from './dto/produce-history.dto';
import { TransactionStatus } from '../transactions/entities/transaction.entity';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

// Create a class to represent the response structure for Swagger
class ProduceHistoryResponse implements ProduceHistoryResponseDto {
  farmerId: string;
  userId: string;
  transactions: TransactionDto[];
  total: number;
  page: number;
  limit: number;
}

@ApiTags('Farmers')
@ApiBearerAuth()
@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post()
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Create farmer profile',
    description: 'Creates a new farmer profile for an authenticated user with the FARMER role.'
  })
  @ApiBody({
    type: CreateFarmerDto,
    description: 'Farmer profile details including name, contact information, and optional metadata'
  })
  @ApiResponse({
    status: 201,
    description: 'Farmer profile has been successfully created',
    type: Farmer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid farmer data or duplicate email'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the FARMER role'
  })
  create(@Request() req, @Body() createFarmerDto: CreateFarmerDto): Promise<Farmer> {
    return this.farmersService.create(req.user.id, createFarmerDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all farmers',
    description: 'Retrieves a paginated list of all farmer profiles. Only accessible by administrators.'
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
  @ApiResponse({
    status: 200,
    description: 'List of farmer profiles retrieved successfully',
    type: Farmer,
    isArray: true
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin privileges'
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ items: Farmer[]; total: number }> {
    return this.farmersService.findAll(page, limit);
  }

  @Get('profile')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Get own profile',
    description: 'Retrieves the authenticated farmer\'s profile information.'
  })
  @ApiResponse({
    status: 200,
    description: 'Farmer profile retrieved successfully',
    type: Farmer
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the FARMER role'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Farmer profile does not exist'
  })
  getProfile(@Request() req): Promise<Farmer> {
    return this.farmersService.findByUserId(req.user.id);
  }

  @Get(':id/produce-history')
  @ApiOperation({
    summary: 'Get farmer\'s produce history',
    description: 'Retrieves the transaction history of produce for a specific farmer with filtering options.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the farmer',
    type: 'string',
    format: 'uuid'
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
  @ApiQuery({
    name: 'startDate',
    description: 'Filter transactions after this date (ISO format)',
    required: false,
    type: String
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Filter transactions before this date (ISO format)',
    required: false,
    type: String
  })
  @ApiQuery({
    name: 'isAvailable',
    description: 'Filter by produce availability',
    required: false,
    type: Boolean
  })
  @ApiQuery({
    name: 'minPrice',
    description: 'Minimum transaction price',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'maxPrice',
    description: 'Maximum transaction price',
    required: false,
    type: Number
  })
  @ApiQuery({
    name: 'transactionStatus',
    description: 'Filter by transaction status',
    required: false,
    enum: TransactionStatus
  })
  @ApiResponse({
    status: 200,
    description: 'Produce history retrieved successfully',
    type: ProduceHistoryResponse
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Farmer with provided ID does not exist'
  })
  async getProduceHistory(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isAvailable', ParseBoolPipe) isAvailable?: boolean,
    @Query('minPrice', ParseIntPipe) minPrice?: number,
    @Query('maxPrice', ParseIntPipe) maxPrice?: number,
    @Query('transactionStatus') transactionStatus?: TransactionStatus,
  ): Promise<ProduceHistoryResponseDto> {
    const query: ProduceHistoryQueryDto = {
      startDate,
      endDate,
      isAvailable,
      page,
      limit,
      minPrice,
      maxPrice,
      transactionStatus,
    };
    return this.farmersService.getProduceHistory(id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get farmer by ID',
    description: 'Retrieves detailed information about a specific farmer.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the farmer',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Farmer profile retrieved successfully',
    type: Farmer
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Farmer with provided ID does not exist'
  })
  findOne(@Param('id') id: string): Promise<Farmer> {
    return this.farmersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Update farmer profile',
    description: 'Updates an existing farmer profile. Farmers can only update their own profile.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the farmer to update',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateFarmerDto,
    description: 'Updated farmer profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'Farmer profile updated successfully',
    type: Farmer
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update this profile'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Farmer with provided ID does not exist'
  })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFarmerDto: UpdateFarmerDto,
  ): Promise<Farmer> {
    return this.farmersService.update(id, updateFarmerDto);
  }
} 