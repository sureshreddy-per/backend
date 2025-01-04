import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/enums/role.enum';

@ApiTags('offers')
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiResponse({ status: 201, description: 'The offer has been successfully created.' })
  async create(
    @Body() createOfferDto: CreateOfferDto,
    @CurrentUser('id') buyerId: string,
  ) {
    return this.offersService.create(buyerId, createOfferDto);
  }

  @Put(':id/price')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Update offer price' })
  @ApiResponse({ status: 200, description: 'The offer price has been successfully updated.' })
  async updatePrice(
    @Param('id') id: string,
    @Body('price') newPrice: number,
    @Body('overrideReason') overrideReason?: string,
  ) {
    return this.offersService.updatePrice(id, newPrice, overrideReason);
  }

  @Post(':id/accept')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Accept an offer' })
  @ApiResponse({ status: 200, description: 'The offer has been successfully accepted.' })
  async accept(@Param('id') id: string, @Body() body: { farmerId: string }) {
    return this.offersService.accept(id, body.farmerId);
  }
} 