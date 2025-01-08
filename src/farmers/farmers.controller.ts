import { Controller, Get, Post, Body, Patch, Query, ParseFloatPipe, UseGuards, UnauthorizedException, Param } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('farmers')
@Controller('farmers')
@UseGuards(JwtAuthGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new farmer profile' })
  @ApiResponse({ 
    status: 201, 
    description: 'Returns created farmer profile with user details'
  })
  createFarmer(@GetUser() user: User) {
    return this.farmersService.createFarmer(user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current farmer profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns farmer profile with user details'
  })
  getFarmerProfile(@GetUser() user: User) {
    return this.farmersService.findByUserId(user.id);
  }

  @Get('nearby')
  findNearbyFarmers(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radiusKm: number,
  ) {
    return this.farmersService.findNearbyFarmers(lat, lng, radiusKm);
  }

  @Post('farms')
  async addFarm(
    @GetUser() user: User,
    @Body() farmData: CreateFarmDto
  ) {
    const farmer = await this.farmersService.findByUserId(user.id);
    return this.farmersService.addFarm(farmer.id, farmData);
  }

  @Patch('farms/:farmId')
  async updateFarm(
    @GetUser() user: User,
    @Param('farmId') farmId: string,
    @Body() farmData: UpdateFarmDto,
  ) {
    const farmer = await this.farmersService.findByUserId(user.id);
    const farm = await this.farmersService.findFarm(farmId);

    if (farm.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only update your own farms');
    }

    return this.farmersService.updateFarm(farmId, farmData);
  }

  @Get('farms/:farmId')
  async findFarm(
    @GetUser() user: User,
    @Param('farmId') farmId: string
  ) {
    const farmer = await this.farmersService.findByUserId(user.id);
    const farm = await this.farmersService.findFarm(farmId);

    if (farm.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only view your own farms');
    }

    return farm;
  }

  @Post('bank-accounts')
  async addBankAccount(
    @GetUser() user: User,
    @Body() bankData: CreateBankAccountDto
  ) {
    const farmer = await this.farmersService.findByUserId(user.id);
    return this.farmersService.addBankAccount(farmer.id, bankData);
  }

  @Patch('bank-accounts/:accountId')
  async updateBankAccount(
    @GetUser() user: User,
    @Param('accountId') accountId: string,
    @Body() bankData: UpdateBankAccountDto,
  ) {
    const farmer = await this.farmersService.findByUserId(user.id);
    const bankAccount = await this.farmersService.findBankAccount(accountId);

    if (bankAccount.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only update your own bank accounts');
    }

    return this.farmersService.updateBankAccount(accountId, bankData);
  }

  @Get('bank-accounts/:accountId')
  async findBankAccount(
    @GetUser() user: User,
    @Param('accountId') accountId: string
  ) {
    const farmer = await this.farmersService.findByUserId(user.id);
    const bankAccount = await this.farmersService.findBankAccount(accountId);

    if (bankAccount.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only view your own bank accounts');
    }

    return bankAccount;
  }

  @Get('offers/:offerId/details')
  @ApiOperation({ summary: 'Get farmer details by offer ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns farmer details with user information for the given offer'
  })
  async getFarmerByOffer(
    @GetUser() user: User,
    @Param('offerId') offerId: string
  ) {
    return this.farmersService.getFarmerByOfferAndBuyer(offerId, user.id);
  }

  @Patch('profile/user-details')
  @ApiOperation({ summary: 'Update farmer user details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns updated farmer profile with user details'
  })
  async updateUserDetails(
    @GetUser() user: User,
    @Body() updateUserDetailsDto: UpdateUserDetailsDto
  ) {
    return this.farmersService.updateUserDetails(user.id, updateUserDetailsDto);
  }
}