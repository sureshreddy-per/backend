import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('buyers')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  createBuyer(
    @Body('user_id') userId: string,
    @Body('business_name') businessName: string,
    @Body('address') address: string,
  ) {
    return this.buyersService.createBuyer(userId, {
      business_name: businessName,
      address: address,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.buyersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.buyersService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.buyersService.remove(id);
  }
} 