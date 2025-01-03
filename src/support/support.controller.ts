import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { SupportStatus } from './entities/support.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileUploadService } from '../common/services/file-upload.service';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'Support ticket created successfully' })
  async create(
    @Body() createSupportDto: CreateSupportDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    const userType = user.role === Role.CUSTOMER ? 'customer' : 'buyer';
    return this.supportService.create(createSupportDto, user.id, userType);
  }

  @Get()
  @ApiOperation({ summary: 'Get all support tickets' })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'limit', required: true, type: Number })
  @ApiQuery({ name: 'status', required: true, enum: SupportStatus })
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: SupportStatus,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    if (user.role === Role.ADMIN) {
      return this.supportService.findAll(page, limit, status);
    }
    const userType = user.role === Role.CUSTOMER ? 'customer' : 'buyer';
    return this.supportService.findByUser(user.id, userType, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a support ticket by ID' })
  @ApiResponse({ status: 200, description: 'Support ticket found' })
  @ApiResponse({ status: 404, description: 'Support ticket not found' })
  async findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a support ticket' })
  @ApiResponse({ status: 200, description: 'Support ticket updated successfully' })
  @ApiResponse({ status: 404, description: 'Support ticket not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSupportDto: UpdateSupportDto,
  ) {
    return this.supportService.update(id, updateSupportDto);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment to a support ticket' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const filePath = await this.fileUploadService.saveFile(file);
    return this.supportService.addAttachment(id, filePath);
  }

  @Delete(':id/attachments/:filename')
  @ApiOperation({ summary: 'Remove an attachment from a support ticket' })
  async removeAttachment(
    @Param('id') id: string,
    @Param('filename') filename: string,
  ) {
    return this.supportService.removeAttachment(id, filename);
  }
} 