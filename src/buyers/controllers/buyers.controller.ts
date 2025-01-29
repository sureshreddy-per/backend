import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BuyersService } from '../services/buyers.service';
import { CreateBuyerDto } from '../dto/create-buyer.dto';
import { UpdateUserDetailsDto } from '../dto/update-user-details.dto';
import { SystemConfigService } from '../../config/services/system-config.service';
import { SystemConfigKey } from '../../config/enums/system-config-key.enum';

@ApiTags('Buyers')
@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BuyersController {
  constructor(
    private readonly buyersService: BuyersService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new buyer profile' })
  @ApiResponse({ status: 201, description: 'Buyer profile created successfully' })
  async createBuyer(
    @GetUser() user: User,
    @Body() createBuyerDto: CreateBuyerDto,
  ) {
    return this.buyersService.createBuyer(user.id, createBuyerDto);
  }

  @Get('me')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Get current buyer details' })
  @ApiResponse({ status: 200, description: 'Returns the buyer details' })
  async getBuyerDetails(@GetUser() user: User) {
    return this.buyersService.getBuyerDetails(user.id);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby buyers' })
  @ApiResponse({ status: 200, description: 'Returns list of nearby buyers' })
  async findNearbyBuyers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 100,
  ) {
    return this.buyersService.findNearbyBuyers(lat, lng, radius);
  }

  @Get(':offerId/details')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Get buyer details by offer ID' })
  @ApiResponse({ status: 200, description: 'Returns the buyer details' })
  async getBuyerDetailsByOfferId(
    @GetUser() user: User,
    @Param('offerId') offerId: string,
  ) {
    return this.buyersService.getBuyerDetailsByOfferId(offerId, user.id);
  }

  @Patch('profile/user-details')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Update buyer user details' })
  @ApiResponse({ status: 200, description: 'Updates the buyer user details' })
  async updateUserDetails(
    @GetUser() user: User,
    @Body() updateUserDetailsDto: UpdateUserDetailsDto,
  ) {
    return this.buyersService.updateUserDetails(user.id, updateUserDetailsDto);
  }
}
