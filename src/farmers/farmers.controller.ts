import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { ProduceHistoryQueryDto, ProduceHistoryResponseDto } from './dto/produce-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Post()
  @Roles(Role.FARMER)
  create(@Request() req, @Body() createFarmerDto: CreateFarmerDto) {
    return this.farmersService.create({
      ...createFarmerDto,
      userId: req.user.id
    });
  }

  @Get()
  findAll() {
    return this.farmersService.findAll();
  }

  @Get('profile')
  @Roles(Role.FARMER)
  async getProfile(@Request() req) {
    const farmer = await this.farmersService.findByUserId(req.user.id);
    return farmer;
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

  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.farmersService.findNearby(lat, lng, radius);
  }
} 