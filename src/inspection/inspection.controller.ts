import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Inspection } from './entities/inspection.entity';

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspection')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionController {
  private readonly logger = new Logger(InspectionController.name);

  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  @Roles(Role.INSPECTOR)
  @ApiOperation({
    summary: 'Create a new inspection',
    description: 'Creates a new inspection record for produce quality assessment.'
  })
  @ApiBody({
    type: CreateInspectionDto,
    description: 'Inspection details including produce ID and inspection method'
  })
  @ApiResponse({
    status: 201,
    description: 'The inspection has been successfully created',
    type: Inspection,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid inspection method or produce ID format'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Referenced produce does not exist'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to create inspections'
  })
  async create(
    @GetUser() user: User,
    @Body() createInspectionDto: CreateInspectionDto
  ) {
    this.logger.log(`Creating new inspection for produce ${createInspectionDto.produceId}`);
    return this.inspectionService.create({
      ...createInspectionDto,
      inspectorId: user.id,
    });
  }

  @Get('my-inspections')
  @Roles(Role.INSPECTOR)
  @ApiOperation({
    summary: 'Get inspections by current inspector',
    description: 'Returns a list of all inspections performed by the current inspector.'
  })
  async findMyInspections(@GetUser() user: User) {
    this.logger.log(`Retrieving inspections for inspector ${user.id}`);
    return this.inspectionService.findByInspector(user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Retrieve all inspections',
    description: 'Returns a list of all inspection records. Admin only.'
  })
  async findAll() {
    this.logger.log('Retrieving all inspections');
    return this.inspectionService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get inspection by ID',
    description: 'Retrieves detailed information about a specific inspection.'
  })
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    this.logger.log(`Retrieving inspection ${id}`);
    const inspection = await this.inspectionService.findOne(id);

    if (user.role !== Role.ADMIN && inspection.inspectorId !== user.id) {
      throw new UnauthorizedException('You can only view your own inspections');
    }

    return inspection;
  }

  @Put(':id')
  @Roles(Role.INSPECTOR)
  @ApiOperation({
    summary: 'Update inspection',
    description: 'Updates an existing inspection record.'
  })
  async update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
  ) {
    this.logger.log(`Updating inspection ${id}`);
    const inspection = await this.inspectionService.findOne(id);

    if (inspection.inspectorId !== user.id) {
      throw new UnauthorizedException('You can only update your own inspections');
    }

    return this.inspectionService.update(id, updateInspectionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete inspection',
    description: 'Removes an inspection record from the system. Admin only.'
  })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting inspection ${id}`);
    return this.inspectionService.remove(id);
  }
}