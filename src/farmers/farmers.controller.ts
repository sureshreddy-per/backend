import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request, Delete, NotFoundException } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto } from './dto/produce-history.dto';
import { CreateFarmDetailsDto } from './dto/farm-details.dto';
import { UpdateFarmDetailsDto } from './dto/farm-details.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '../users/entities/user.entity';
import { BankDetails } from './entities/bank-details.entity';

@ApiTags('farmers')
@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post()
  @Roles(Role.FARMER)
  async create(@Request() req, @Body() createFarmerDto: CreateFarmerDto) {
    const farmer = await this.farmersService.create({
      ...createFarmerDto,
      userId: req.user.id
    });
    return farmer;
  }

  @Get()
  findAll() {
    return this.farmersService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.farmersService.findNearby(lat, lng, radius);
  }

  @Get('profile')
  @Roles(Role.FARMER)
  async getProfile(@Request() req) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return farmer;
  }

  @Get('profile/produce-history')
  @Roles(Role.FARMER)
  async getProduceHistory(
    @Request() req,
    @Query() query: ProduceHistoryQueryDto
  ): Promise<ProduceHistoryResponseDto> {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.getProduceHistory(farmer.id, {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined
    });
  }

  @Get('farms')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get all farms of the farmer' })
  async getFarms(@Request() req) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    if (!farmer) {
      throw new NotFoundException('Farmer profile not found. Please create a farmer profile first.');
    }
    return this.farmersService.getFarms(farmer.id);
  }

  @Get('farms/:id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get farm details by ID' })
  async getFarm(@Request() req, @Param('id') id: string) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.getFarmById(farmer.id, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmersService.findOne(id);
  }

  @Put('profile')
  @Roles(Role.FARMER)
  async updateProfile(@Request() req, @Body() updateFarmerDto: UpdateFarmerDto) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.update(farmer.id, updateFarmerDto);
  }

  @Post('bank-accounts')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Add a new bank account' })
  @ApiResponse({ status: 201, description: 'Bank account added successfully' })
  async addBankAccount(
    @Request() req,
    @Body() bankDetails: Partial<BankDetails>
  ) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.addBankAccount(farmer.id, bankDetails);
  }

  @Put('bank-accounts/:id/primary')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Set a bank account as primary' })
  @ApiResponse({ status: 200, description: 'Bank account set as primary' })
  async setPrimaryBankAccount(
    @Request() req,
    @Param('id') bankDetailsId: string
  ) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.setPrimaryBankAccount(farmer.id, bankDetailsId);
  }

  @Delete('bank-accounts/:id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiResponse({ status: 200, description: 'Bank account deleted successfully' })
  async deleteBankAccount(
    @Request() req,
    @Param('id') bankDetailsId: string
  ) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.deleteBankAccount(farmer.id, bankDetailsId);
  }

  @Post('farms')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Add a new farm' })
  async addFarm(@Request() req, @Body() createFarmDetailsDto: CreateFarmDetailsDto) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.addFarm(farmer.id, createFarmDetailsDto);
  }

  @Put('farms/:id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Update farm details' })
  async updateFarm(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFarmDetailsDto: UpdateFarmDetailsDto
  ) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.updateFarm(farmer.id, id, updateFarmDetailsDto);
  }

  @Delete('farms/:id')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Delete a farm' })
  async deleteFarm(@Request() req, @Param('id') id: string) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.deleteFarm(farmer.id, id);
  }

  @Get('farms/:id/produce')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get all produce from a specific farm' })
  async getFarmProduce(@Request() req, @Param('id') id: string) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return this.farmersService.getFarmProduce(farmer.id, id);
  }
} 