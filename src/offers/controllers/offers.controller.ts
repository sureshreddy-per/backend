import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UnauthorizedException, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { OffersService } from '../services/offers.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { ProduceService } from '../../produce/services/produce.service';

@ApiTags('Offers')
@ApiBearerAuth()
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly produceService: ProduceService
  ) {}

  @Post('admin/create')
  @Roles(Role.ADMIN)
  async createByAdmin(@Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(createOfferDto);
  }

  @Post()
  @Roles(Role.BUYER)
  async create(
    @GetUser() user: User,
    @Body() createOfferDto: CreateOfferDto
  ) {
    const produce = await this.produceService.findOne(createOfferDto.produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    return this.offersService.create({
      ...createOfferDto,
      buyer_id: user.id,
      farmer_id: produce.farmer_id,
    });
  }

  @Get()
  async findAll(@GetUser() user: User) {
    if (user.role === Role.ADMIN) {
      return this.offersService.findAll();
    }
    return this.offersService.findByBuyer(user.id);
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const offer = await this.offersService.findOne(id);

    if (user.role !== Role.ADMIN && offer.buyer_id !== user.id) {
      throw new UnauthorizedException('You can only view your own offers');
    }

    return offer;
  }

  @Post(':id/reject')
  @Roles(Role.BUYER, Role.FARMER)
  async reject(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException('You can only reject your own offers');
    }

    return this.offersService.reject(id, reason);
  }

  @Post(':id/cancel')
  @Roles(Role.BUYER)
  async cancel(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException('You can only cancel your own offers');
    }

    return this.offersService.cancel(id, reason);
  }

  @Delete(':id')
  @Roles(Role.BUYER)
  async remove(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const offer = await this.offersService.findOne(id);

    if (offer.buyer_id !== user.id) {
      throw new UnauthorizedException('You can only delete your own offers');
    }

    return this.offersService.remove(id);
  }
}