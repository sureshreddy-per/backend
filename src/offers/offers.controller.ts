import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OffersService } from './services/offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(UserRole.BUYER)
  create(@Body() createOfferDto: CreateOfferDto, @Req() req: any) {
    return this.offersService.create(createOfferDto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Post(':id/accept')
  @Roles(UserRole.FARMER)
  accept(@Param('id') id: string) {
    return this.offersService.accept(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.FARMER)
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.offersService.reject(id, reason);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BUYER)
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.offersService.cancel(id, reason);
  }
} 