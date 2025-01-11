import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { BuyerPricesService } from "../services/buyer-prices.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Role } from "../../auth/enums/role.enum";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import { BuyersService } from "../buyers.service";

@Controller("buyer-prices")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyerPricesController {
  constructor(
    private readonly buyerPricesService: BuyerPricesService,
    private readonly buyersService: BuyersService,
  ) {}

  @Post("price-change")
  @Roles(Role.BUYER)
  async handlePriceChange(
    @GetUser() user: User,
    @Body() body: { produceId: string; newPrice: number },
  ): Promise<void> {
    const buyer = await this.buyersService.findByUserId(user.id);
    return this.buyerPricesService.handlePriceChange(
      body.produceId,
      body.newPrice,
    );
  }
}
