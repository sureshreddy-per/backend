import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseFloatPipe,
  UseGuards,
  UnauthorizedException,
  DefaultValuePipe,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { BuyersService } from "./buyers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { Buyer } from "./entities/buyer.entity";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/enums/role.enum";
import { UpdateBuyerDetailsDto } from "./dto/update-buyer-details.dto";

@Controller("buyers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyersController {
  private readonly logger = new Logger(BuyersController.name);

  constructor(private readonly buyersService: BuyersService) {}

  @Post("profile")
  @Roles(Role.ADMIN, Role.BUYER)
  async createProfile(@GetUser() user: User, @Body() createBuyerDto: Partial<Buyer>) {
    try {
      this.logger.debug(`Creating profile for user ${user.id}`);
      const result = await this.buyersService.createBuyer(user.id, createBuyerDto);
      this.logger.debug(`Profile created successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to create buyer profile");
    }
  }

  @Get("profile")
  @Roles(Role.ADMIN, Role.BUYER)
  async getProfile(@GetUser() user: User) {
    try {
      this.logger.debug(`Getting profile for user ${user.id}`);
      const result = await this.buyersService.findByUserId(user.id);
      this.logger.debug(`Profile retrieved successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to get buyer profile");
    }
  }

  @Get("details")
  @Roles(Role.BUYER)
  async getBuyerDetails(@GetUser() user: User) {
    try {
      this.logger.debug(`Getting details for user ${user.id}`);
      const result = await this.buyersService.getBuyerDetails(user.id);
      this.logger.debug(`Details retrieved successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting details: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to get buyer details");
    }
  }

  @Post("details/update")
  @Roles(Role.BUYER)
  async updateBuyerDetails(
    @GetUser() user: User,
    @Body() updateBuyerDetailsDto: UpdateBuyerDetailsDto,
  ) {
    try {
      this.logger.debug(`Updating details for user ${user.id}`);
      const result = await this.buyersService.updateBuyerDetails(
        user.id,
        updateBuyerDetailsDto,
      );
      this.logger.debug(`Details updated successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating details: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to update buyer details");
    }
  }

  @Get("details/offer/:offerId")
  @Roles(Role.FARMER)
  async getBuyerDetailsByOfferId(
    @GetUser() user: User,
    @Param("offerId") offerId: string,
  ) {
    try {
      this.logger.debug(`Getting details for offer ${offerId}`);
      const result = await this.buyersService.getBuyerDetailsByOfferId(offerId, user.id);
      this.logger.debug(`Details retrieved successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting details by offer: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to get buyer details by offer");
    }
  }

  @Get("preferences")
  @Roles(Role.BUYER)
  async getBuyerPreferences(@GetUser() user: User) {
    try {
      this.logger.debug(`Getting preferences for user ${user.id}`);
      const result = await this.buyersService.getBuyerPreferences(user.id);
      this.logger.debug(`Preferences retrieved successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting preferences: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to get buyer preferences");
    }
  }

  @Post("preferences/price-range")
  @Roles(Role.BUYER)
  async updatePriceRangePreferences(
    @GetUser() user: User,
    @Body() data: { min_price: number; max_price: number; categories?: string[] }
  ) {
    try {
      this.logger.debug(`Updating price range preferences for user ${user.id}`);
      const result = await this.buyersService.updatePriceRangePreferences(user.id, data);
      this.logger.debug(`Price range preferences updated successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating price range preferences: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to update price range preferences");
    }
  }

  @Get("search/nearby")
  async findNearbyBuyers(
    @Query("lat", ParseFloatPipe) lat: number,
    @Query("lng", ParseFloatPipe) lng: number,
    @Query("radius", new DefaultValuePipe(10), ParseFloatPipe) radiusKm = 10,
  ) {
    try {
      this.logger.debug(`Finding nearby buyers at lat: ${lat}, lng: ${lng}, radius: ${radiusKm}`);
      const buyers = await this.buyersService.findNearbyBuyers(
        lat,
        lng,
        radiusKm,
      );
      this.logger.debug(`Found ${buyers.length} nearby buyers`);
      return {
        success: true,
        data: buyers,
        count: buyers.length,
      };
    } catch (error) {
      this.logger.error(`Error finding nearby buyers: ${error.message}`, error.stack);
      return {
        success: false,
        error: "Failed to find nearby buyers",
        details: error.message,
      };
    }
  }

  @Get(":id")
  async findOne(@GetUser() user: User, @Param("id") id: string) {
    try {
      this.logger.debug(`Finding buyer with ID ${id}`);
      const buyer = await this.buyersService.findOne(id);

      if (user.role !== Role.ADMIN && buyer.user_id !== user.id) {
        throw new UnauthorizedException(
          "You can only view your own buyer profile",
        );
      }

      this.logger.debug(`Buyer found successfully: ${JSON.stringify(buyer)}`);
      return buyer;
    } catch (error) {
      this.logger.error(`Error finding buyer: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to find buyer");
    }
  }
}
