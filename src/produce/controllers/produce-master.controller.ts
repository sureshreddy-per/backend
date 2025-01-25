import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProduceMasterService } from '../services/produce-master.service';
import { ProduceMaster } from '../entities/produce-master.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

class CreateProduceMasterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subCategory?: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

class UpdateProduceMasterDto extends CreateProduceMasterDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('Produce Master')
@Controller('produce-master')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProduceMasterController {
  constructor(private readonly produceMasterService: ProduceMasterService) {}

  @Get()
  @ApiOperation({ summary: 'Get all supported produces' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'subCategory', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all supported produces',
    type: [ProduceMaster],
  })
  async findAll(
    @Query('isActive') isActive?: boolean,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
    @Query('search') search?: string,
  ): Promise<ProduceMaster[]> {
    return this.produceMasterService.findAll({
      isActive,
      category,
      subCategory,
      search,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all produce categories with subcategories' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of categories with their subcategories',
  })
  async getCategories() {
    return this.produceMasterService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get produce by id' })
  @ApiResponse({
    status: 200,
    description: 'Returns the produce details',
    type: ProduceMaster,
  })
  async findOne(@Param('id') id: string): Promise<ProduceMaster> {
    return this.produceMasterService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new produce master entry' })
  @ApiResponse({
    status: 201,
    description: 'The produce has been successfully created',
    type: ProduceMaster,
  })
  async create(
    @Body() createDto: CreateProduceMasterDto,
    @Request() req: any,
  ): Promise<ProduceMaster> {
    return this.produceMasterService.create({
      ...createDto,
      createdBy: req.user.id,
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a produce master entry' })
  @ApiResponse({
    status: 200,
    description: 'The produce has been successfully updated',
    type: ProduceMaster,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProduceMasterDto,
    @Request() req: any,
  ): Promise<ProduceMaster> {
    return this.produceMasterService.update(id, {
      ...updateDto,
      updatedBy: req.user.id,
    });
  }

  @Delete(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a produce master entry' })
  @ApiResponse({
    status: 200,
    description: 'The produce has been successfully deactivated',
  })
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.produceMasterService.deactivate(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a produce master entry' })
  @ApiResponse({
    status: 200,
    description: 'The produce has been successfully activated',
  })
  async activate(@Param('id') id: string): Promise<void> {
    return this.produceMasterService.activate(id);
  }
} 