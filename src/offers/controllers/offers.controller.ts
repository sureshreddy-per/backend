import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  Request,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Role } from "../../auth/enums/role.enum";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import { OffersService } from "../services/offers.service";
import { AutoOfferService } from "../services/auto-offer.service";
import { OverrideAutoOfferDto } from "../dto/override-auto-offer.dto";
import { ApproveOfferDto } from "../dto/approve-offer.dto";
import { ProduceService } from "../../produce/services/produce.service";

@ApiTags("Offers")
@ApiBearerAuth()
@Controller("offers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService,
  ) {}

  @Get()
  async findAll(@GetUser() user: User) {
    if (user.role === Role.ADMIN) {
      return this.offersService.findAll();
    }
    return this.offersService.findByBuyer(user.id);
  }

  @Get(":id")
  async findOne(@GetUser() user: User, @Param("id") id: string) {
    const offer = await this.offersService.findOne(id);

    if (user.role !== Role.ADMIN && offer.buyer_id !== user.id) {
      throw new UnauthorizedException("You can only view your own offers");
    }

    return offer;
  }

  @Post(":id/approve")
  @Roles(Role.BUYER)
  @ApiOperation({ summary: "Approve an auto-generated offer with optional price modification" })
  @ApiResponse({ status: 200, description: "Offer approved successfully" })
  @ApiResponse({ status: 400, description: "Invalid price modification" })
  async approveOffer(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() approveOfferDto: ApproveOfferDto,
  ) {
    return this.autoOfferService.approveOffer(id, user.id, approveOfferDto);
  }

  @Post(":id/reject")
  @Roles(Role.BUYER)
  @ApiOperation({ summary: "Reject an auto-generated offer" })
  @ApiResponse({ status: 200, description: "Offer rejected successfully" })
  async rejectOffer(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    if (!reason) {
      throw new BadRequestException("Reason is required for rejecting an offer");
    }
    return this.autoOfferService.rejectOffer(id, user.id, reason);
  }

  @Post(":id/cancel")
  @Roles(Role.BUYER)
  async cancel(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException("You can only cancel your own offers");
    }

    return this.offersService.cancel(id, reason);
  }

  @Delete(":id")
  @Roles(Role.BUYER)
  async remove(@GetUser() user: User, @Param("id") id: string) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException("You can only delete your own offers");
    }

    return this.offersService.remove(id);
  }

  @Put(":id/override-price")
  @Roles(Role.BUYER)
  @ApiOperation({ summary: "Override offer price" })
  @ApiResponse({ status: 200, description: "Price successfully overridden" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Offer not found" })
  async overridePrice(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() overrideOfferPriceDto: OverrideAutoOfferDto,
  ) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException("You can only override prices of your own offers");
    }

    return this.offersService.overridePrice(id, overrideOfferPriceDto.price_per_unit);
  }
}
