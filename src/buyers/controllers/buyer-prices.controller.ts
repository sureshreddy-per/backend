import { Controller, Get, Post, Body, Param, Put, Delete, Query, Req } from '@nestjs/common';
import { BuyerPricesService } from '../services/buyer-prices.service';
import { CreateBuyerPriceDto } from '../dto/create-buyer-price.dto';
import { UpdateBuyerPriceDto } from '../dto/update-buyer-price.dto';

@Controller('buyer-prices')
export class BuyerPricesController {
  constructor(private readonly buyerPricesService: BuyerPricesService) {}

  @Post()
  create(@Body() createBuyerPriceDto: CreateBuyerPriceDto, @Req() req) {
    return this.buyerPricesService.create(req.user.id, createBuyerPriceDto);
  }

  @Get()
  findAll() {
    return this.buyerPricesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buyerPricesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateBuyerPriceDto: UpdateBuyerPriceDto) {
    return this.buyerPricesService.update(id, updateBuyerPriceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buyerPricesService.remove(id);
  }
} 