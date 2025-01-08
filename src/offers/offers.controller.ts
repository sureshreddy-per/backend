import { Controller, Get, Post, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { OffersService } from './services/offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(UserRole.BUYER)
  create(
    @GetUser() user: User,
    @Body() createOfferDto: CreateOfferDto
  ) {
    return this.offersService.create({
      ...createOfferDto,
      buyer_id: user.id,
    });
  }

  @Get('my-offers')
  findMyOffers(@GetUser() user: User) {
    return this.offersService.findByBuyer(user.id);
  }

  @Get('received-offers')
  @Roles(UserRole.FARMER)
  findReceivedOffers(@GetUser() user: User) {
    return this.offersService.findByFarmer(user.id);
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== user.id && offer.farmer_id !== user.id) {
      throw new UnauthorizedException('You can only view your own offers');
    }
    return offer;
  }

  @Post(':id/accept')
  @Roles(UserRole.FARMER)
  async accept(@GetUser() user: User, @Param('id') id: string) {
    const offer = await this.offersService.findOne(id);
    if (offer.farmer_id !== user.id) {
      throw new UnauthorizedException('You can only accept offers made to you');
    }
    return this.offersService.accept(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.FARMER)
  async reject(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    const offer = await this.offersService.findOne(id);
    if (offer.farmer_id !== user.id) {
      throw new UnauthorizedException('You can only reject offers made to you');
    }
    return this.offersService.reject(id, reason);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BUYER)
  async cancel(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException('You can only cancel your own offers');
    }
    return this.offersService.cancel(id, reason);
  }
}