import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ProduceService } from './produce.service';
import { Produce } from './entities/produce.entity';
import { CreateProduceDto } from './dto/create-produce.dto';
import { UpdateProduceDto } from './dto/update-produce.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Produce')
@ApiBearerAuth()
@Controller('produce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProduceController {
  constructor(private readonly produceService: ProduceService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new produce listing' })
  @ApiResponse({ status: 201, description: 'Produce listing created successfully' })
  async create(
    @Body() createProduceDto: CreateProduceDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.produceService.create(createProduceDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all produce listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.produceService.findAll(page, limit);
  }

  @Get('customer')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get produce listings for current customer' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByCustomer(
    @CurrentUser() user: { id: string; role: Role },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.produceService.findByCustomer(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a produce listing by ID' })
  @ApiResponse({ status: 200, description: 'Returns the produce listing' })
  async findOne(@Param('id') id: string) {
    return this.produceService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Update a produce listing' })
  @ApiResponse({ status: 200, description: 'Produce listing updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateProduceDto: UpdateProduceDto,
  ) {
    return this.produceService.update(id, updateProduceDto);
  }

  @Post(':id/photos')
  @Roles(Role.CUSTOMER)
  @UseInterceptors(FilesInterceptor('photos'))
  @ApiOperation({ summary: 'Upload photos for a produce listing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async addPhotos(
    @Param('id') id: string,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    const photoUrls = photos.map(photo => photo.filename);
    return this.produceService.addPhotos(id, photoUrls);
  }

  @Delete(':id/photos/:filename')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Remove a photo from a produce listing' })
  async removePhoto(
    @Param('id') id: string,
    @Param('filename') filename: string,
  ) {
    return this.produceService.removePhoto(id, filename);
  }

  @Post(':id/video')
  @Roles(Role.CUSTOMER)
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Upload video for a produce listing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateVideo(
    @Param('id') id: string,
    @UploadedFile() video: Express.Multer.File,
  ) {
    return this.produceService.updateVideo(id, video.filename);
  }

  @Patch(':id/location')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Update produce location' })
  async updateLocation(
    @Param('id') id: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.produceService.updateLocation(id, lat, lng);
  }
} 