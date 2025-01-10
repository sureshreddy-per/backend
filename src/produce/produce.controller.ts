import { Controller, Get, Post, Body, Param, Delete, UseGuards, UnauthorizedException, Query, ParseIntPipe, DefaultValuePipe, Patch, ParseFloatPipe } from '@nestjs/common';
import { ProduceService } from './services/produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Produce } from './entities/produce.entity';
import { ProduceCategory } from './enums/produce-category.enum';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { FarmersService } from '../farmers/farmers.service';
import { ProduceStatus } from './enums/produce-status.enum';

@Controller('produce')
@UseGuards(JwtAuthGuard)
export class ProduceController {
  constructor(
    private readonly produceService: ProduceService,
    private readonly farmerService: FarmersService
  ) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() createProduceDto: CreateProduceDto
  ) {
    const farmer = await this.farmerService.findByUserId(user.id);
    const produceData = {
      ...createProduceDto,
      farmer_id: farmer.id,
      status: ProduceStatus.AVAILABLE
    };
    return this.produceService.create(produceData);
  }

  @Get()
  findAll(
    @Query('farm_id') farm_id?: string,
    @Query('status') status?: ProduceStatus,
    @Query('produce_category') produce_category?: ProduceCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Produce>> {
    return this.produceService.findAndPaginate({
      where: {
        ...(farm_id && { farm_id }),
        ...(status && { status }),
        ...(produce_category && { produce_category })
      },
      take: limit,
      skip: (page - 1) * limit
    });
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
    @Query('radius', new DefaultValuePipe(10), ParseFloatPipe) radius = 10,
  ): Promise<Produce[]> {
    return this.produceService.findNearby(lat, lon, radius);
  }

  @Get('my')
  findMyProduce(
    @GetUser() user: User,
    @Query('farm_id') farm_id?: string,
    @Query('status') status?: ProduceStatus,
    @Query('produce_category') produce_category?: ProduceCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Produce>> {
    return this.produceService.findAndPaginate({
      where: {
        farmer_id: user.id,
        ...(farm_id && { farm_id }),
        ...(status && { status }),
        ...(produce_category && { produce_category })
      },
      take: limit,
      skip: (page - 1) * limit
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produceService.findById(id);
  }

  @Patch(':id')
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateProduceDto: UpdateProduceDto
  ) {
    const produce = await this.produceService.findById(id);
    if (!produce) {
      throw new UnauthorizedException('Produce not found');
    }

    const farmer = await this.farmerService.findByUserId(user.id);
    if (produce.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only update your own produce');
    }
    
    return this.produceService.update(id, updateProduceDto);
  }

  @Delete(':id')
  async remove(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const produce = await this.produceService.findById(id);
    if (!produce) {
      throw new UnauthorizedException('Produce not found');
    }

    const farmer = await this.farmerService.findByUserId(user.id);
    if (produce.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only delete your own produce');
    }
    
    return this.produceService.deleteById(id);
  }
}