import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { Quality } from './entities/quality.entity';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';
import { AssessQualityDto } from './dto/assess-quality.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Quality')
@ApiBearerAuth()
@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create quality parameters' })
  @ApiResponse({ status: 201, description: 'Quality parameters created successfully' })
  async create(@Body() createQualityDto: CreateQualityDto): Promise<Quality> {
    return this.qualityService.create(createQualityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quality parameters' })
  @ApiResponse({ status: 200, description: 'Return all quality parameters' })
  async findAll(): Promise<Quality[]> {
    return this.qualityService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quality parameters by ID' })
  @ApiResponse({ status: 200, description: 'Return quality parameters' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Quality> {
    return this.qualityService.findOne(id);
  }

  @Get('produce/:type')
  @ApiOperation({ summary: 'Get quality parameters by produce type' })
  @ApiResponse({ status: 200, description: 'Return quality parameters' })
  async findByProduceType(@Param('type') type: string): Promise<Quality[]> {
    return this.qualityService.findByProduceType(type);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update quality parameters' })
  @ApiResponse({ status: 200, description: 'Quality parameters updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQualityDto: UpdateQualityDto,
  ): Promise<Quality> {
    return this.qualityService.update(id, updateQualityDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete quality parameters' })
  @ApiResponse({ status: 200, description: 'Quality parameters deleted successfully' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.qualityService.remove(id);
  }

  @Post('assess')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assess produce quality' })
  @ApiResponse({ status: 200, description: 'Return quality score' })
  async assessQuality(@Body() assessQualityDto: AssessQualityDto): Promise<number> {
    return this.qualityService.assessQuality(assessQualityDto);
  }

  @Get('parameters/:type')
  @ApiOperation({ summary: 'Get quality parameters structure' })
  @ApiResponse({ status: 200, description: 'Return quality parameters structure' })
  async getQualityParameters(@Param('type') type: string): Promise<Record<string, any>> {
    return this.qualityService.getQualityParameters(type);
  }
} 