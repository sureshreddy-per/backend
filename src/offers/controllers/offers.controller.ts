import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { OffersService } from '../services/offers.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { ProduceService } from '../../produce/produce.service';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly produceService: ProduceService,
  ) {}

  @Post()
  @Roles(UserRole.BUYER)
  create(@Body() createOfferDto: CreateOfferDto, @Request() req) {
    return this.offersService.create(createOfferDto, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Post(':id/accept')
  @Roles(UserRole.FARMER)
  async accept(@Request() req, @Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    const farmer = await this.produceService.getFarmerByUserId(req.user.id);
    const produce = await this.produceService.findOne(offer.produceId);

    if (produce.farmerId !== farmer.id) {
      throw new ForbiddenException('You can only accept offers for your own produce');
    }

    return this.offersService.accept(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.FARMER)
  async reject(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    const offer = await this.offersService.findOne(id);
    const farmer = await this.produceService.getFarmerByUserId(req.user.id);
    const produce = await this.produceService.findOne(offer.produceId);

    if (produce.farmerId !== farmer.id) {
      throw new ForbiddenException('You can only reject offers for your own produce');
    }

    return this.offersService.reject(id, reason);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BUYER)
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyerId !== req.user.id) {
      throw new ForbiddenException('You can only cancel your own offers');
    }

    return this.offersService.cancel(id, reason);
  }
} 