import { Controller, Get, Post, Body, Param, Delete, UseGuards, UnauthorizedException, Query, ParseIntPipe, DefaultValuePipe, Patch, ParseFloatPipe } from '@nestjs/common';
import { ProduceService } from './produce.service';
import { CreateProduceDto } from './dto/create-produce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Produce, ProduceStatus, ProduceCategory } from './entities/produce.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { UpdateProduceDto } from './dto/update-produce.dto';

@Controller('produce')
@UseGuards(JwtAuthGuard)
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

  @Post()
  create(
    @GetUser() user: User,
    @Body() createProduceDto: CreateProduceDto
  ) {
    return this.produceService.create({
      ...createProduceDto,
      farmer_id: user.id,
    });
  }

  @Get()
  findAll(
    @Query('farm_id') farm_id?: string,
    @Query('status') status?: ProduceStatus,
    @Query('produce_category') produce_category?: ProduceCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Produce>> {
    return this.produceService.findAll({
      farm_id,
      status,
      produce_category,
      page,
      limit,
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

  @Get('my-produce')
  findMyProduce(
    @GetUser() user: User,
    @Query('farm_id') farm_id?: string,
    @Query('status') status?: ProduceStatus,
    @Query('produce_category') produce_category?: ProduceCategory,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Produce>> {
    return this.produceService.findAll({
      farmer_id: user.id,
      farm_id,
      status,
      produce_category,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produceService.findOne(id);
  }

  @Patch(':id')
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateProduceDto: UpdateProduceDto
  ) {
    const produce = await this.produceService.findOne(id);

    if (produce.farmer_id !== user.id) {
      throw new UnauthorizedException('You can only update your own produce listings');
    }

    return this.produceService.update(id, updateProduceDto);
  }

  @Delete(':id')
  async remove(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const produce = await this.produceService.findOne(id);

    if (produce.farmer_id !== user.id) {
      throw new UnauthorizedException('You can only delete your own produce listings');
    }

    return this.produceService.remove(id);
  }
}