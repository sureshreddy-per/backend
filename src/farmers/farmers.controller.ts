import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseFloatPipe } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Controller('farmers')
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post(':userId')
  createFarmer(@Param('userId') userId: string) {
    return this.farmersService.createFarmer(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmersService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.farmersService.findByUserId(userId);
  }

  @Get('nearby')
  findNearbyFarmers(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radiusKm: number,
  ) {
    return this.farmersService.findNearbyFarmers(lat, lng, radiusKm);
  }

  @Post(':farmerId/farms')
  addFarm(
    @Param('farmerId') farmerId: string,
    @Body() farmData: CreateFarmDto,
  ) {
    return this.farmersService.addFarm(farmerId, farmData);
  }

  @Patch('farms/:farmId')
  updateFarm(
    @Param('farmId') farmId: string,
    @Body() farmData: UpdateFarmDto,
  ) {
    return this.farmersService.updateFarm(farmId, farmData);
  }

  @Get('farms/:farmId')
  findFarm(@Param('farmId') farmId: string) {
    return this.farmersService.findFarm(farmId);
  }

  @Post(':farmerId/bank-accounts')
  addBankAccount(
    @Param('farmerId') farmerId: string,
    @Body() bankData: CreateBankAccountDto,
  ) {
    return this.farmersService.addBankAccount(farmerId, bankData);
  }

  @Patch('bank-accounts/:accountId')
  updateBankAccount(
    @Param('accountId') accountId: string,
    @Body() bankData: UpdateBankAccountDto,
  ) {
    return this.farmersService.updateBankAccount(accountId, bankData);
  }

  @Get('bank-accounts/:accountId')
  findBankAccount(@Param('accountId') accountId: string) {
    return this.farmersService.findBankAccount(accountId);
  }
} 