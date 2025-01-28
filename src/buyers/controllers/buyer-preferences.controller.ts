import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BuyerPreferencesService } from '../services/buyer-preferences.service';
import { UpdateBuyerPreferencesDto } from '../dto/update-buyer-preferences.dto';
import { BuyersService } from '../services/buyers.service';

@ApiTags('Buyer Preferences')
@Controller('buyer-preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BuyerPreferencesController {
  constructor(
    private readonly buyerPreferencesService: BuyerPreferencesService,
    private readonly buyersService: BuyersService
  ) {}

  @Get()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Get buyer preferences' })
  @ApiResponse({ status: 200, description: 'Returns the buyer preferences' })
  async getPreferences(@GetUser() user: User) {
    try {
      return await this.buyerPreferencesService.findByBuyerId(user.id);
    } catch (error) {
      if (error.status === 404) {
        // If preferences don't exist, create default ones
        const buyer = await this.buyersService.getBuyerDetails(user.id);
        return this.buyerPreferencesService.createDefaultPreferences(buyer.id);
      }
      throw error;
    }
  }

  @Put()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Update buyer preferences' })
  @ApiResponse({ status: 200, description: 'Updates the buyer preferences' })
  async updatePreferences(
    @GetUser() user: User,
    @Body() data: UpdateBuyerPreferencesDto,
  ) {
    try {
      const buyer = await this.buyersService.getBuyerDetails(user.id);
      let preferences;
      try {
        preferences = await this.buyerPreferencesService.findByBuyerId(buyer.id);
      } catch (error) {
        if (error.status === 404) {
          // If preferences don't exist, create them with the provided data
          preferences = await this.buyerPreferencesService.createDefaultPreferences(buyer.id);
        } else {
          throw error;
        }
      }
      return this.buyerPreferencesService.setPreferences(buyer.id, data);
    } catch (error) {
      throw error;
    }
  }
}