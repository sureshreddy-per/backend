import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Post()
  @Roles([UserRole.ADMIN])
  createBuyer(
    @Body('user_id') userId: string,
    @Body() createBuyerDto: CreateBuyerDto,
  ) {
    return this.buyersService.createBuyer(userId, createBuyerDto);
  }

  @Get()
  @Roles([UserRole.ADMIN])
  findAll() {
    return this.buyersService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radiusKm: number = 50,
  ) {
    return this.buyersService.findNearbyBuyers(lat, lng, radiusKm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buyersService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.buyersService.findByUserId(userId);
  }

  @Patch(':id')
  @Roles([UserRole.BUYER, UserRole.ADMIN])
  update(
    @Param('id') id: string,
    @Body() updateBuyerDto: Partial<CreateBuyerDto>,
  ) {
    return this.buyersService.update(id, updateBuyerDto);
  }

  @Delete(':id')
  @Roles([UserRole.ADMIN])
  remove(@Param('id') id: string) {
    return this.buyersService.remove(id);
  }
} 