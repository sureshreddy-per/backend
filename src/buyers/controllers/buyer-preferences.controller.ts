import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Role } from "../../auth/enums/role.enum";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import { BuyerPreferencesService } from "../services/buyer-preferences.service";
import { BuyerPreferences } from "../entities/buyer-preferences.entity";

@Controller("buyers/preferences")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BUYER)
export class BuyerPreferencesController {
  constructor(
    private readonly preferencesService: BuyerPreferencesService,
  ) {}

  @Post("price-alerts")
  async setPriceAlert(
    @GetUser() user: User,
    @Body()
    data: {
      target_price: number;
      condition: string;
      notification_methods: string[];
      expiry_date: Date;
    },
  ): Promise<BuyerPreferences> {
    try {
      console.log('Setting price alert for user:', user.id);
      console.log('Request data:', data);
      
      const result = await this.preferencesService.setPriceAlert(user.id, data);
      console.log('Price alert set successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in setPriceAlert controller:', error);
      throw error;
    }
  }

  @Get("price-alerts")
  async getPriceAlerts(@GetUser() user: User): Promise<BuyerPreferences[]> {
    try {
      console.log('Getting price alerts for user:', user.id);
      const result = await this.preferencesService.getPriceAlerts(user.id);
      console.log('Price alerts retrieved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in getPriceAlerts controller:', error);
      throw error;
    }
  }

  @Patch("price-alerts/:id")
  async updatePriceAlert(
    @GetUser() user: User,
    @Param("id") alertId: string,
    @Body() data: Partial<BuyerPreferences>,
  ): Promise<BuyerPreferences> {
    try {
      console.log('Updating price alert for user:', user.id);
      console.log('Alert ID:', alertId);
      console.log('Update data:', data);
      
      const result = await this.preferencesService.updatePriceAlert(user.id, alertId, data);
      console.log('Price alert updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in updatePriceAlert controller:', error);
      throw error;
    }
  }

  @Delete("price-alerts/:id")
  @HttpCode(HttpStatus.OK)
  async deletePriceAlert(
    @GetUser() user: User,
    @Param("id") alertId: string,
  ): Promise<{ message: string }> {
    try {
      console.log('Deleting price alert for user:', user.id);
      console.log('Alert ID:', alertId);
      
      const result = await this.preferencesService.deletePriceAlert(user.id, alertId);
      console.log('Price alert deleted successfully');
      return result;
    } catch (error) {
      console.error('Error in deletePriceAlert controller:', error);
      throw error;
    }
  }

  @Post("price-range")
  async setPreferredPriceRange(
    @GetUser() user: User,
    @Body()
    data: {
      min_price: number;
      max_price: number;
      categories?: string[];
    },
  ): Promise<BuyerPreferences> {
    try {
      console.log('Setting preferred price range for user:', user.id);
      console.log('Request data:', data);
      
      const result = await this.preferencesService.setPreferredPriceRange(user.id, data);
      console.log('Preferred price range set successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in setPreferredPriceRange controller:', error);
      throw error;
    }
  }

  @Get()
  async getPreferences(@GetUser() user: User): Promise<BuyerPreferences> {
    try {
      console.log('Getting preferences for user:', user.id);
      const result = await this.preferencesService.getPreferences(user.id);
      console.log('Preferences retrieved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in getPreferences controller:', error);
      throw error;
    }
  }
} 