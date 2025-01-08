import { Controller, Get, Post, Body, Param, Query, ParseFloatPipe, UseGuards, UnauthorizedException } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Buyer } from './entities/buyer.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Post('profile')
  @Roles(Role.BUYER)
  createProfile(@GetUser() user: User, @Body() createBuyerDto: Partial<Buyer>) {
    return this.buyersService.createBuyer(user.id, createBuyerDto);
  }

  @Get('profile')
  @Roles(Role.BUYER)
  getProfile(@GetUser() user: User) {
    return this.buyersService.findByUserId(user.id);
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const buyer = await this.buyersService.findOne(id);

    if (user.role !== Role.ADMIN && buyer.user_id !== user.id) {
      throw new UnauthorizedException('You can only view your own buyer profile');
    }

    return buyer;
  }

  @Get('nearby')
  findNearbyBuyers(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radiusKm: number,
  ) {
    return this.buyersService.findNearbyBuyers(lat, lng, radiusKm);
  }
}