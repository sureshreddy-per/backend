import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { DailyPriceService } from "../services/daily-price.service";
import { CreateDailyPriceDto } from "../dto/create-daily-price.dto";
import { UpdateDailyPriceDto } from "../dto/update-daily-price.dto";
import { DailyPrice } from "../entities/daily-price.entity";
import { ProduceCategory } from "../../produce/enums/produce-category.enum";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Daily Prices")
@Controller("daily-prices")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyPriceController {
  constructor(private readonly dailyPriceService: DailyPriceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @ApiOperation({ summary: "Create a new daily price" })
  @ApiResponse({ status: 201, description: "Daily price created successfully" })
  async create(
    @Body() createDailyPriceDto: CreateDailyPriceDto,
  ): Promise<DailyPrice> {
    return this.dailyPriceService.create(createDailyPriceDto);
  }

  @Get("active")
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @ApiOperation({ summary: "Get all active prices for a buyer" })
  async findAllActive(
    @Query("buyer_id") buyer_id: string,
  ): Promise<DailyPrice[]> {
    return this.dailyPriceService.findAllActive(buyer_id);
  }

  @Get("active/:category")
  @Roles(UserRole.ADMIN, UserRole.BUYER, UserRole.FARMER)
  @ApiOperation({ summary: "Get active price for a specific category" })
  async findActive(
    @Query("buyer_id") buyer_id: string,
    @Param("category") category: ProduceCategory,
  ): Promise<DailyPrice> {
    return this.dailyPriceService.findActive(buyer_id, category);
  }

  @Get("remaining-updates/:category")
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @ApiOperation({ summary: "Get remaining price updates for today" })
  @ApiResponse({
    status: 200,
    description: "Returns the number of remaining price updates for today",
  })
  async getRemainingUpdates(
    @Query("buyer_id") buyer_id: string,
  ): Promise<{ remaining_updates: number }> {
    const remaining = await this.dailyPriceService.getRemainingUpdates(buyer_id);
    return { remaining_updates: remaining };
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @ApiOperation({ summary: "Update a daily price" })
  @ApiResponse({ status: 200, description: "Daily price updated successfully" })
  async update(
    @Param("id") id: string,
    @Body() updateDailyPriceDto: UpdateDailyPriceDto,
  ): Promise<DailyPrice> {
    return this.dailyPriceService.update(id, updateDailyPriceDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.BUYER)
  @ApiOperation({ summary: "Deactivate a daily price" })
  @ApiResponse({ status: 200, description: "Daily price deactivated successfully" })
  async deactivate(@Param("id") id: string) {
    return await this.dailyPriceService.deactivate(id);
  }
}
