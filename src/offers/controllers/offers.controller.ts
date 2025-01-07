import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProduceService } from '../../produce/produce.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Offers')
@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly produceService: ProduceService,
  ) {}

  @Post()
  async create(@Body() createOfferDto: CreateOfferDto, @Request() req) {
    createOfferDto.buyer_id = req.user.id;
    return this.offersService.create(createOfferDto);
  }

  @Get()
  async findAll() {
    return this.offersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const offer = await this.offersService.findOne(id);
    const produce = await this.produceService.findOne(offer.produce_id);
    return { ...offer, produce };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
    @Request() req,
  ) {
    const offer = await this.offersService.findOne(id);
    const produce = await this.produceService.findOne(offer.produce_id);
    return this.offersService.update(id, updateOfferDto);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Request() req) {
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== req.user.id) {
      throw new Error('Only the buyer can accept their own offer');
    }
    return this.offersService.accept(id);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== req.user.id) {
      throw new Error('Only the buyer can reject their own offer');
    }
    return this.offersService.reject(id, reason);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== req.user.id) {
      throw new Error('Only the buyer can cancel their own offer');
    }
    return this.offersService.cancel(id, reason);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== req.user.id) {
      throw new Error('Only the buyer can delete their own offer');
    }
    return this.offersService.remove(id);
  }
} 