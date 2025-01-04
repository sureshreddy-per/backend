import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(createOfferDto);
  }

  @Get()
  findAll() {
    return this.offersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
    return this.offersService.update(id, updateOfferDto);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Body() body: { farmerId: string }) {
    return this.offersService.accept(id, body.farmerId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string, @Req() req) {
    return this.offersService.reject(id, req.user.id, reason);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason: string, @Req() req) {
    return this.offersService.cancel(id, req.user.id, reason);
  }
} 