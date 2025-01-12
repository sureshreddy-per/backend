import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BuyersService } from '../buyers.service';
import { UpdateBuyerPreferencesDto } from '../dto/update-buyer-preferences.dto';

@ApiTags('Buyer Preferences')
@Controller('buyer-preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BuyerPreferencesController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Get buyer preferences' })
  @ApiResponse({ status: 200, description: 'Returns the buyer preferences' })
  async getPreferences(@GetUser() user: User) {
    return this.buyersService.getPreferences(user.id);
  }

  @Put()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Update buyer preferences' })
  @ApiResponse({ status: 200, description: 'Updates the buyer preferences' })
  async updatePreferences(
    @GetUser() user: User,
    @Body() data: UpdateBuyerPreferencesDto,
  ) {
    return this.buyersService.updatePreferences(user.id, data);
  }
} 