import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BuyersService } from './buyers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Buyer } from './entities/buyer.entity';
import { CreateBuyerPriceDto } from './dto/create-buyer-price.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

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
  create(@Request() req, @Body() buyerData: Partial<Buyer>) {
    return this.buyersService.create(req.user.id, buyerData);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all buyers',
    description: 'Retrieves a paginated list of all buyer profiles. Only accessible by administrators.'
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
  getProfile(@Request() req) {
    return this.buyersService.findByUser(req.user.id);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby buyers',
    description: 'Retrieves a list of buyers within a specified radius of given coordinates.'
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
  findOne(@Param('id') id: string) {
    return this.buyersService.findOne(id);
  }

  @Patch('profile')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Update buyer profile',
    description: 'Updates the authenticated buyer\'s profile.'
  })
  async updateProfile(
    @Request() req,
    @Body() updateData: Partial<Buyer>,
  ) {
    const buyer = await this.buyersService.findByUser(req.user.id);
    return this.buyersService.update(buyer.id, updateData);
  }

  @Post('prices')
  @ApiOperation({ summary: 'Set daily price for a quality grade' })
  @ApiResponse({ status: 201, description: 'The price has been successfully set.' })
  @Roles(Role.BUYER)
  async setBuyerPrice(
    @Request() req,
    @Body() createBuyerPriceDto: CreateBuyerPriceDto,
  ) {
    const buyer = await this.buyersService.findByUser(req.user.id);
    return this.buyersService.createBuyerPrice(buyer.id, createBuyerPriceDto);
  }

  @Get('prices')
  @ApiOperation({ summary: 'Get all active prices for the authenticated buyer' })
  @ApiResponse({ status: 200, description: 'Returns the list of active prices.' })
  @Roles(Role.BUYER)
  async getBuyerPrices(
    @Request() req,
    @Query('date') date?: string,
  ) {
    const buyer = await this.buyersService.findByUser(req.user.id);
    const effectiveDate = date ? new Date(date) : new Date();
    return this.buyersService.getBuyerPrices(buyer.id, effectiveDate);
  }

  @Get('prices/:grade')
  @ApiOperation({ summary: 'Get current price for a specific grade' })
  @ApiResponse({ status: 200, description: 'Returns the current price for the specified grade.' })
  @Roles(Role.BUYER)
  async getBuyerPriceByGrade(
    @Request() req,
    @Param('grade') grade: string,
    @Query('date') date?: string,
  ) {
    const buyer = await this.buyersService.findByUser(req.user.id);
    const effectiveDate = date ? new Date(date) : new Date();
    return this.buyersService.getBuyerPriceByGrade(buyer.id, grade, effectiveDate);
  }
} 