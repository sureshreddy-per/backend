import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BuyerPricesService } from '../services/buyer-prices.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Controller('buyer-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyerPricesController {
  constructor(private readonly buyerPricesService: BuyerPricesService) {}

  @Post('price-change')
  @Roles(UserRole.BUYER)
  async handlePriceChange(
    @Body() body: { produceId: string; newPrice: number }
  ): Promise<void> {
    return this.buyerPricesService.handlePriceChange(body.produceId, body.newPrice);
  }
} 