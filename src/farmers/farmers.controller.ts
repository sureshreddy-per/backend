import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post()
  @Roles([UserRole.ADMIN])
  createFarmer(@Body('user_id') userId: string) {
    return this.farmersService.createFarmer(userId);
  }

  @Get()
  @Roles([UserRole.ADMIN])
  findAll() {
    return this.farmersService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radiusKm: number = 50,
  ) {
    return this.farmersService.findNearbyFarmers(lat, lng, radiusKm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmersService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.farmersService.findByUserId(userId);
  }

  // Farm management endpoints
  @Post(':id/farms')
  @Roles([UserRole.FARMER, UserRole.ADMIN])
  addFarm(
    @Param('id') farmerId: string,
    @Body() farmData: CreateFarmDto,
  ) {
    return this.farmersService.addFarm(farmerId, farmData);
  }

  @Patch('farms/:id')
  @Roles([UserRole.FARMER, UserRole.ADMIN])
  updateFarm(
    @Param('id') farmId: string,
    @Body() farmData: Partial<CreateFarmDto>,
  ) {
    return this.farmersService.updateFarm(farmId, farmData);
  }

  @Delete('farms/:id')
  @Roles([UserRole.FARMER, UserRole.ADMIN])
  removeFarm(@Param('id') farmId: string) {
    return this.farmersService.removeFarm(farmId);
  }

  // Bank account management endpoints
  @Post(':id/bank-accounts')
  @Roles([UserRole.FARMER, UserRole.ADMIN])
  addBankAccount(
    @Param('id') farmerId: string,
    @Body() bankData: CreateBankAccountDto,
  ) {
    return this.farmersService.addBankAccount(farmerId, bankData);
  }

  @Patch('bank-accounts/:id')
  @Roles([UserRole.FARMER, UserRole.ADMIN])
  updateBankAccount(
    @Param('id') accountId: string,
    @Body() bankData: Partial<CreateBankAccountDto>,
  ) {
    return this.farmersService.updateBankAccount(accountId, bankData);
  }

  @Delete('bank-accounts/:id')
  @Roles([UserRole.FARMER, UserRole.ADMIN])
  removeBankAccount(@Param('id') accountId: string) {
    return this.farmersService.removeBankAccount(accountId);
  }
} 