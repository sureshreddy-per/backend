import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { QualityService } from './quality.service';
import { Quality } from './entities/quality.entity';
import { CreateQualityDto } from './dto/create-quality.dto';

@ApiTags('Quality Assessment')
@Controller('quality')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  @Roles(Role.ADMIN, Role.QUALITY_INSPECTOR)
  @ApiOperation({
    summary: 'Create quality assessment',
    description: 'Creates a new quality assessment record. Only accessible by administrators and quality inspectors.'
  })
  @ApiBody({
    type: CreateQualityDto,
    description: 'Quality assessment details including grade, criteria, and notes'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'The quality assessment has been successfully created',
    type: Quality 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid quality assessment data' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have required role' 
  })
  async create(@Body() createQualityDto: CreateQualityDto): Promise<Quality> {
    return this.qualityService.create(createQualityDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all quality assessments',
    description: 'Returns a list of all quality assessment records in the system.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of quality assessments retrieved successfully',
    type: [Quality] 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have permission to view quality assessments' 
  })
  async findAll(): Promise<Quality[]> {
    return this.qualityService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get quality assessment by ID',
    description: 'Retrieves detailed information about a specific quality assessment.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the quality assessment',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'The quality assessment record has been successfully retrieved',
    type: Quality 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Not Found - Quality assessment with provided ID does not exist' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have permission to view this quality assessment' 
  })
  async findOne(@Param('id') id: string): Promise<Quality> {
    return this.qualityService.findOne(id);
  }

  @Put(':id/finalize')
  @Roles(Role.ADMIN, Role.QUALITY_INSPECTOR)
  @ApiOperation({
    summary: 'Finalize quality assessment',
    description: 'Finalizes a quality assessment and triggers offer updates. Only accessible by administrators and quality inspectors.'
  })
  @ApiParam({
    name: 'id',
    description: 'Quality assessment ID to finalize'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        finalPrice: {
          type: 'number',
          description: 'The final price determined based on quality assessment'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'The quality assessment has been finalized',
    type: Quality 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Quality assessment not found' 
  })
  async finalize(
    @Param('id') id: string,
    @Body('finalPrice') finalPrice: number
  ): Promise<Quality> {
    return this.qualityService.finalizeQualityAssessment(id, finalPrice);
  }
} 