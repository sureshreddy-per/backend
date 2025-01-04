import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Inspection } from './entities/inspection.entity';

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspection')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionController {
  private readonly logger = new Logger(InspectionController.name);

  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
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
  async create(@Body() createInspectionDto: CreateInspectionDto) {
    this.logger.log(`Creating new inspection for produce ${createInspectionDto.produceId}`);
    return this.inspectionService.create(createInspectionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all inspections',
    description: 'Returns a list of all inspection records with pagination support.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all inspections retrieved successfully',
    type: [Inspection],
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have permission to view inspections' 
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
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the inspection',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'The inspection record has been successfully retrieved',
    type: Inspection,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Not Found - Inspection with provided ID does not exist' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have permission to view this inspection' 
  })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Retrieving inspection ${id}`);
    return this.inspectionService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update inspection',
    description: 'Updates an existing inspection record. Only accessible by administrators.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the inspection to update',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateInspectionDto,
    description: 'Updated inspection details'
  })
  @ApiResponse({
    status: 200,
    description: 'The inspection has been successfully updated',
    type: Inspection,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid status transition or data format' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Not Found - Inspection, Inspector, or Quality grade not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin privileges' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
  ) {
    this.logger.log(`Updating inspection ${id}`);
    return this.inspectionService.update(id, updateInspectionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete inspection',
    description: 'Removes an inspection record from the system. Only accessible by administrators.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the inspection to delete',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'The inspection has been successfully deleted',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Not Found - Inspection with provided ID does not exist' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin privileges' 
  })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting inspection ${id}`);
    return this.inspectionService.remove(id);
  }
} 