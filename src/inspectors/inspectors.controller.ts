import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseFloatPipe, UseGuards, UnauthorizedException } from '@nestjs/common';
import { InspectorsService } from './inspectors.service';
import { CreateInspectorDto } from './dto/create-inspector.dto';
import { UpdateInspectorDto } from './dto/update-inspector.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('inspectors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectorsController {
  constructor(private readonly inspectorsService: InspectorsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createInspectorDto: CreateInspectorDto) {
    return this.inspectorsService.create(createInspectorDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.inspectorsService.findAll();
  }

  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radiusKm: number,
  ) {
    return this.inspectorsService.findNearby(lat, lng, radiusKm);
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const inspector = await this.inspectorsService.findOne(id);

    if (user.role !== Role.ADMIN && inspector.id !== user.id) {
      throw new UnauthorizedException('You can only view your own inspector profile');
    }

    return inspector;
  }

  @Patch(':id')
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateInspectorDto: UpdateInspectorDto
  ) {
    const inspector = await this.inspectorsService.findOne(id);

    if (user.role !== Role.ADMIN && inspector.id !== user.id) {
      throw new UnauthorizedException('You can only update your own inspector profile');
    }

    return this.inspectorsService.update(id, updateInspectorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.inspectorsService.remove(id);
  }
}