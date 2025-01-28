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
  Query,
  DefaultValuePipe,
  ParseIntPipe,
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
import { UserRole } from "../../enums/user-role.enum";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import { OffersService } from "../services/offers.service";
import { AutoOfferService } from "../services/auto-offer.service";
import { OverrideAutoOfferDto } from "../dto/override-auto-offer.dto";
import { ApproveOfferDto } from "../dto/approve-offer.dto";
import { ProduceService } from "../../produce/services/produce.service";
import { CreateOfferDto } from "../dto/create-offer.dto";
import { UpdateOfferDto } from "../dto/update-offer.dto";
import { OfferStatus } from "../enums/offer-status.enum";
import { CreateAdminOfferDto } from "../dto/create-admin-offer.dto";
import { ListOffersDto } from "../dto/list-offers.dto";
import { ProduceStatus } from "../../produce/enums/produce-status.enum";
import { FarmersService } from "../../farmers/farmers.service";
import { BuyersService } from "../../buyers/buyers.service";

@ApiTags("Offers")
@ApiBearerAuth()
@Controller("offers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly autoOfferService: AutoOfferService,
    private readonly produceService: ProduceService,
    private readonly farmersService: FarmersService,
    private readonly buyersService: BuyersService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUYER, UserRole.FARMER)
  @ApiOperation({ summary: "Get all offers with filtering and sorting options" })
  @ApiResponse({ status: 200, description: "Returns paginated list of offers" })
  async findAll(@GetUser() user: User, @Query() query: ListOffersDto) {
    if (user.role === UserRole.ADMIN) {
      return this.offersService.findAll(query);
    }
    if (user.role === UserRole.BUYER) {
      const buyer = await this.buyersService.findByUserId(user.id);
      return this.offersService.findByBuyer(buyer.id, query);
    }
    // For farmers
    const farmer = await this.farmersService.findByUserId(user.id);
    return this.offersService.findByFarmer(farmer.id, query);
  }

  @Get("details/:id")
  @Roles(UserRole.ADMIN, UserRole.BUYER, UserRole.FARMER)
  async findOne(@GetUser() user: User, @Param("id") id: string) {
    const offer = await this.offersService.findOne(id);

    if (user.role === UserRole.ADMIN) {
      return offer;
    }

    if (user.role === UserRole.BUYER) {
      const buyer = await this.buyersService.findByUserId(user.id);
      if (offer.buyer_id !== buyer.id) {
        throw new UnauthorizedException("You can only view your own offers");
      }
    }

    if (user.role === UserRole.FARMER) {
      const farmer = await this.farmersService.findByUserId(user.id);
      if (offer.farmer_id !== farmer.id) {
        throw new UnauthorizedException("You can only view offers for your produce");
      }
    }

    return offer;
  }

  @Post("approve/:id")
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: "Approve an auto-generated offer with optional price modification" })
  @ApiResponse({ status: 200, description: "Offer approved successfully" })
  @ApiResponse({ status: 400, description: "Invalid price modification" })
  async approveOffer(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() approveOfferDto: ApproveOfferDto,
  ) {
    const buyer = await this.buyersService.findByUserId(user.id);
    return this.autoOfferService.approveOffer(id, buyer.id, approveOfferDto);
  }

  @Post("reject/:id")
  @Roles(UserRole.BUYER)
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
    const buyer = await this.buyersService.findByUserId(user.id);
    return this.autoOfferService.rejectOffer(id, buyer.id, reason);
  }

  @Post("cancel/:id")
  @Roles(UserRole.BUYER)
  async cancel(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    const buyer = await this.buyersService.findByUserId(user.id);
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== buyer.id) {
      throw new UnauthorizedException("You can only cancel your own offers");
    }

    return this.offersService.cancel(id, reason);
  }

  @Delete("delete/:id")
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  async remove(@GetUser() user: User, @Param("id") id: string) {
    const offer = await this.offersService.findOne(id);
    if (user.role !== UserRole.ADMIN) {
      const buyer = await this.buyersService.findByUserId(user.id);
      if (offer.buyer_id !== buyer.id) {
        throw new UnauthorizedException("You can only delete your own offers");
      }
    }
    return this.offersService.remove(id);
  }

  @Put("override-price/:id")
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: "Override offer price" })
  @ApiResponse({ status: 200, description: "Price successfully overridden" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Offer not found" })
  async overridePrice(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() overrideOfferPriceDto: OverrideAutoOfferDto,
  ) {
    const buyer = await this.buyersService.findByUserId(user.id);
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== buyer.id) {
      throw new UnauthorizedException("You can only override prices of your own offers");
    }

    return this.offersService.overridePrice(id, overrideOfferPriceDto.price_per_unit);
  }

  @Post()
  @Roles(UserRole.BUYER)
  async create(@GetUser() user: User, @Body() createOfferDto: CreateOfferDto) {
    const buyer = await this.buyersService.findByUserId(user.id);
    if (!buyer) {
      throw new NotFoundException(`Buyer not found for user ${user.id}`);
    }
    createOfferDto.buyer_id = buyer.id;
    createOfferDto.farmer_id = createOfferDto.farmer_id;
    return this.offersService.create(createOfferDto);
  }

  @Put("update/:id")
  @Roles(UserRole.BUYER)
  async update(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    const buyer = await this.buyersService.findByUserId(user.id);
    const offer = await this.offersService.findOne(id);
    if (offer.buyer_id !== buyer.id) {
      throw new UnauthorizedException("You can only update your own offers");
    }
    return this.offersService.updateStatus(id, OfferStatus.PENDING);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @ApiOperation({ summary: 'Get offer statistics' })
  @ApiResponse({ status: 200, description: 'Returns offer statistics' })
  async getStats() {
    return this.offersService.getStats();
  }

  @Post("admin")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create an offer as admin with minimum fields" })
  @ApiResponse({ status: 201, description: "Offer created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input data" })
  async createAsAdmin(@Body() createAdminOfferDto: CreateAdminOfferDto) {
    return this.offersService.createAdminOffer(createAdminOfferDto);
  }

  @Post("reactivate-for-produce/:produceId")
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: "Reactivate offers for a produce after expired transaction" })
  @ApiResponse({ status: 200, description: "Offers reactivated successfully" })
  @ApiResponse({ status: 400, description: "Invalid produce status or ownership" })
  @ApiResponse({ status: 404, description: "Produce not found" })
  async reactivateOffersForProduce(
    @GetUser() user: User,
    @Param("produceId") produceId: string,
  ) {
    // Get the produce
    const produce = await this.produceService.findOne(produceId);
    if (!produce) {
      throw new NotFoundException("Produce not found");
    }

    // Get farmer details using user ID
    const farmer = await this.farmersService.findByUserId(user.id);
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${user.id} not found`);
    }

    // Verify ownership
    if (produce.farmer_id !== farmer.id) {
      throw new UnauthorizedException("You can only reactivate offers for your own produce");
    }

    // Verify produce status is from an expired transaction
    if (produce.status !== ProduceStatus.IN_PROGRESS) {
      throw new BadRequestException("Can only reactivate offers for produce with expired transactions");
    }

    // Find and update the existing transaction to mark it as expired
    const existingTransaction = await this.offersService.findLatestTransactionForProduce(produceId);
    if (existingTransaction) {
      await this.offersService.markTransactionAsExpired(existingTransaction.id, {
        reason: "Transaction expired and produce reactivated by farmer",
        reactivated_at: new Date(),
        reactivated_by: user.id
      });
    }

    // Cancel any existing active offers for this produce
    await this.offersService.cancelAllOffersForProduce(produceId, "Produce reactivated by farmer");

    // Update produce status back to ASSESSED
    await this.produceService.update(produceId, {
      status: ProduceStatus.ASSESSED
    });

    // Generate new auto offers
    await this.autoOfferService.generateOffersForProduce(produce);

    return {
      message: "Produce reactivated and new offers generated successfully",
      produce_id: produceId,
      status: ProduceStatus.ASSESSED,
      previous_transaction_id: existingTransaction?.id
    };
  }

  @Post("farmer/accept/:id")
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: "Farmer accepts an offer for their produce" })
  @ApiResponse({ status: 200, description: "Offer accepted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized - Not the produce owner" })
  @ApiResponse({ status: 404, description: "Offer not found" })
  async farmerAcceptOffer(
    @GetUser() user: User,
    @Param("id") id: string
  ) {
    // Get the offer
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    // Get farmer details using user ID
    const farmer = await this.farmersService.findByUserId(user.id);
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${user.id} not found`);
    }

    // Verify ownership
    if (offer.farmer_id !== farmer.id) {
      throw new UnauthorizedException("You can only accept offers for your own produce");
    }

    // Accept the offer
    return this.offersService.accept(id);
  }

  @Post("farmer/reject/:id")
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: "Farmer rejects an offer for their produce" })
  @ApiResponse({ status: 200, description: "Offer rejected successfully" })
  @ApiResponse({ status: 400, description: "Bad Request - Reason required" })
  @ApiResponse({ status: 401, description: "Unauthorized - Not the produce owner" })
  @ApiResponse({ status: 404, description: "Offer not found" })
  async farmerRejectOffer(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body("reason") reason: string
  ) {
    // Get the offer
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    // Get farmer details using user ID
    const farmer = await this.farmersService.findByUserId(user.id);
    if (!farmer) {
      throw new NotFoundException(`Farmer with user ID ${user.id} not found`);
    }

    // Verify ownership
    if (offer.farmer_id !== farmer.id) {
      throw new UnauthorizedException("You can only reject offers for your own produce");
    }

    if (!reason) {
      throw new BadRequestException("Reason is required for rejecting an offer");
    }

    return this.offersService.reject(id, reason);
  }
}
