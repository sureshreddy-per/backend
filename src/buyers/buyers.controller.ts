import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BuyersService } from './buyers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Buyer } from './entities/buyer.entity';

@ApiTags('Buyers')
@ApiBearerAuth()
@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Create buyer profile',
    description: 'Creates a new buyer profile for an authenticated user with the BUYER role.'
  })
  @ApiBody({
    type: Buyer,
    description: 'Buyer profile details including business information and preferences'
  })
  @ApiResponse({
    status: 201,
    description: 'Buyer profile has been successfully created',
    type: Buyer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid buyer data'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  create(@Request() req, @Body() buyerData: Partial<Buyer>) {
    return this.buyersService.create(req.user.id, buyerData);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all buyers',
    description: 'Retrieves a paginated list of all buyer profiles. Only accessible by administrators.'
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
    description: 'List of buyer profiles retrieved successfully',
    type: Buyer,
    isArray: true
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin privileges'
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.buyersService.findAll(page, limit);
  }

  @Get('profile')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Get own profile',
    description: 'Retrieves the authenticated buyer\'s profile information.'
  })
  @ApiResponse({
    status: 200,
    description: 'Buyer profile retrieved successfully',
    type: Buyer
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Buyer profile does not exist'
  })
  getProfile(@Request() req) {
    return this.buyersService.findByUser(req.user.id);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby buyers',
    description: 'Retrieves a list of buyers within a specified radius of given coordinates.'
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude coordinate',
    required: true,
    type: Number,
    example: 40.7128
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude coordinate',
    required: true,
    type: Number,
    example: -74.0060
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in kilometers',
    required: false,
    type: Number,
    example: 50
  })
  @ApiResponse({
    status: 200,
    description: 'List of nearby buyers retrieved successfully',
    type: Buyer,
    isArray: true
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid coordinates'
  })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.buyersService.findNearby(lat, lng, radius);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get buyer by ID',
    description: 'Retrieves detailed information about a specific buyer.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the buyer',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Buyer profile retrieved successfully',
    type: Buyer
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Buyer with provided ID does not exist'
  })
  findOne(@Param('id') id: string) {
    return this.buyersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Update buyer profile',
    description: 'Updates an existing buyer profile. Buyers can only update their own profile.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the buyer to update',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: Buyer,
    description: 'Updated buyer profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'Buyer profile updated successfully',
    type: Buyer
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update this profile'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Buyer with provided ID does not exist'
  })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<Buyer>,
  ) {
    return this.buyersService.update(id, updateData);
  }
} 