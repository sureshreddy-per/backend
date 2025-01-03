import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BuyersService } from './buyers.service';
import { Buyer } from './entities/buyer.entity';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Buyers')
@ApiBearerAuth()
@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all buyers' })
  @ApiResponse({ status: 200, description: 'Return all buyers' })
  async findAll(): Promise<Buyer[]> {
    return this.buyersService.findAll();
  }

  @Get('profile')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Get buyer profile' })
  @ApiResponse({ status: 200, description: 'Return buyer profile' })
  async getProfile(@CurrentUser() buyer: Buyer): Promise<Buyer> {
    return this.buyersService.findOne(buyer.id);
  }

  @Put('profile')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Update buyer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() buyer: Buyer,
    @Body() updateBuyerDto: UpdateBuyerDto,
  ): Promise<Buyer> {
    return this.buyersService.update(buyer.id, updateBuyerDto);
  }

  @Put('location')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Update buyer location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  async updateLocation(
    @CurrentUser() buyer: Buyer,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Buyer> {
    return this.buyersService.updateLocation(
      buyer.id,
      updateLocationDto.lat,
      updateLocationDto.lng,
    );
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby buyers' })
  @ApiResponse({ status: 200, description: 'Return nearby buyers' })
  async findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radius: number,
  ): Promise<Buyer[]> {
    return this.buyersService.findNearby(lat, lng, radius);
  }

  @Put(':id/block')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Block a buyer' })
  @ApiResponse({ status: 200, description: 'Buyer blocked successfully' })
  async block(@Param('id', ParseUUIDPipe) id: string): Promise<Buyer> {
    return this.buyersService.block(id);
  }

  @Put(':id/unblock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unblock a buyer' })
  @ApiResponse({ status: 200, description: 'Buyer unblocked successfully' })
  async unblock(@Param('id', ParseUUIDPipe) id: string): Promise<Buyer> {
    return this.buyersService.unblock(id);
  }
} 