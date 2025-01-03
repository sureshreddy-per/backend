import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Offers')
@ApiBearerAuth()
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiResponse({ status: 201, description: 'Offer created successfully' })
  async create(
    @Body() createOfferDto: CreateOfferDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Offer> {
    return this.offersService.create(createOfferDto, buyerId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all offers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all offers' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.offersService.findAll(page, limit);
  }

  @Get('my-offers')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Get buyer\'s offers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return buyer\'s offers' })
  async findMyOffers(
    @CurrentUser('id') buyerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.offersService.findByBuyer(buyerId, page, limit);
  }

  @Get('produce/:produceId')
  @ApiOperation({ summary: 'Get offers for a produce listing' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return offers for the produce' })
  async findByProduce(
    @Param('produceId', ParseUUIDPipe) produceId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.offersService.findByProduce(produceId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an offer by ID' })
  @ApiResponse({ status: 200, description: 'Return the offer' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Offer> {
    return this.offersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Update an offer' })
  @ApiResponse({ status: 200, description: 'Offer updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ): Promise<Offer> {
    return this.offersService.update(id, updateOfferDto);
  }

  @Put(':id/accept')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Accept an offer' })
  @ApiResponse({ status: 200, description: 'Offer accepted successfully' })
  async accept(@Param('id', ParseUUIDPipe) id: string): Promise<Offer> {
    return this.offersService.accept(id);
  }

  @Put(':id/reject')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Reject an offer' })
  @ApiResponse({ status: 200, description: 'Offer rejected successfully' })
  async reject(@Param('id', ParseUUIDPipe) id: string): Promise<Offer> {
    return this.offersService.reject(id);
  }
} 