import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { BuyerPricesService } from '../services/buyer-prices.service';
import { CreateBuyerPriceDto } from '../dto/create-buyer-price.dto';
import { UpdateBuyerPriceDto } from '../dto/update-buyer-price.dto';

@ApiTags('Buyer Prices')
@ApiBearerAuth()
@Controller('buyer-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyerPricesController {
  constructor(private readonly buyerPricesService: BuyerPricesService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Create a new daily price for a quality grade' })
  @ApiResponse({ status: 201, description: 'Price has been successfully set' })
  async create(@Body() createBuyerPriceDto: CreateBuyerPriceDto) {
    return this.buyerPricesService.create(createBuyerPriceDto);
  }

  @Patch(':id')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Update an existing price' })
  @ApiResponse({ status: 200, description: 'Price has been successfully updated' })
  async update(
    @Param('id') id: string,
    @Body() updateBuyerPriceDto: UpdateBuyerPriceDto,
  ) {
    return this.buyerPricesService.update(id, updateBuyerPriceDto);
  }

  @Get(':buyerId')
  @ApiOperation({ summary: 'Get all prices for a buyer' })
  @ApiResponse({ status: 200, description: 'Returns the list of prices' })
  async findByBuyer(
    @Param('buyerId') buyerId: string,
    @Query('date') date?: string,
    @Query('grade') grade?: string,
    @Query('active') active?: boolean,
  ) {
    return this.buyerPricesService.findByBuyer(buyerId, {
      date: date ? new Date(date) : undefined,
      grade,
      active,
    });
  }

  @Get(':buyerId/current')
  @ApiOperation({ summary: 'Get current active prices for a buyer' })
  @ApiResponse({ status: 200, description: 'Returns the current active prices' })
  async getCurrentPrices(
    @Param('buyerId') buyerId: string,
    @Query('grade') grade?: string,
  ) {
    return this.buyerPricesService.getCurrentPrices(buyerId, grade);
  }

  @Get(':buyerId/history')
  @ApiOperation({ summary: 'Get price history for a buyer' })
  @ApiResponse({ status: 200, description: 'Returns the price history' })
  async getPriceHistory(
    @Param('buyerId') buyerId: string,
    @Query('grade') grade?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.buyerPricesService.getPriceHistory(
      buyerId,
      grade,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
} 