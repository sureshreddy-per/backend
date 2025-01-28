import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Patch,
  ParseFloatPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  UsePipes,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ProduceService } from "./services/produce.service";
import { CreateProduceDto } from "./dto/create-produce.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { Produce } from "./entities/produce.entity";
import { ProduceCategory } from "./enums/produce-category.enum";
import { PaginatedResponse } from "../common/interfaces/paginated-response.interface";
import { UpdateProduceDto } from "./dto/update-produce.dto";
import { FarmersService } from "../farmers/farmers.service";
import { ProduceStatus } from "./enums/produce-status.enum";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GcpStorageService } from "../common/services/gcp-storage.service";
import { OpenAIService } from "../quality/services/openai.service";
import { FileValidationPipe } from "../common/pipes/file-validation.pipe";
import { StorageUploadType } from "../common/enums/storage-upload-type.enum";
import { retry } from "../common/utils/retry.util";
import { ConfigService } from "@nestjs/config";
import { RequestAiVerificationDto } from '../quality/dto/request-ai-verification.dto';
import { ParseJsonPipe } from "../common/pipes/parse-json.pipe";
import { Express } from 'express';
import { StorageService } from '../common/interfaces/storage.interface';
import { Inject } from '@nestjs/common';
import { STORAGE_SERVICE } from '../common/providers/storage.provider';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

interface CreateProduceInput extends CreateProduceDto {
  farmer_id: string;
  images: string[];
  status: ProduceStatus;
}

@Controller("produce")
@UseGuards(JwtAuthGuard)
export class ProduceController {
  private readonly logger = new Logger(ProduceController.name);
  private readonly retryOptions: { maxAttempts: number };

  constructor(
    private readonly produceService: ProduceService,
    private readonly farmerService: FarmersService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    private readonly openAIService: OpenAIService,
    private readonly configService: ConfigService,
  ) {
    this.retryOptions = {
      maxAttempts: this.configService.get<number>('S3_MAX_ATTEMPTS_PROD', 5),
    };
  }

  private async cleanupUploadedFiles(fileKeys: string[]) {
    try {
      await Promise.all(
        fileKeys.map(key =>
          retry(
            () => this.storageService.deleteFile(key),
            this.retryOptions,
            this.logger,
            `Delete file ${key}`
          ).catch(error => {
            this.logger.error(`Failed to delete file ${key} after retries: ${error.message}`);
          })
        )
      );
    } catch (error) {
      this.logger.error(`Error during file cleanup: ${error.message}`);
    }
  }

  private async uploadFileWithRetry(
    file: Express.Multer.File,
    path: string,
    metadata: Record<string, string>,
  ) {
    return retry(
      () => this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        {
          contentType: file.mimetype,
          path,
          metadata,
        }
      ),
      this.retryOptions,
      this.logger,
      `Upload file ${file.originalname}`
    );
  }

  private async analyzeImageWithRetry(
    file: Express.Multer.File,
    produceId: string,
  ) {
    return this.openAIService.analyzeProduceWithMultipleImages([
      {
        buffer: file.buffer,
        mimeType: file.mimetype
      }
    ], produceId);
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 3 },
    { name: 'video', maxCount: 1 }
  ], {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, callback) => {
      const logger = new Logger('FileFilter');
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|heic|heif)$/)) {
        logger.error(`Invalid file type: ${file.mimetype}`);
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    }
  }))
  async create(
    @UploadedFiles() files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Body('data', new ParseJsonPipe()) createProduceDto: Omit<CreateProduceDto, 'images'>,
    @GetUser() user: User,
  ) {
    try {
      // Validate farmer
      const farmer = await this.farmerService.findByUserId(user.id);
      if (!farmer) {
        throw new UnauthorizedException('User is not a farmer');
      }

      const uploadedImageKeys: string[] = [];
      const uploadedVideoKeys: string[] = [];

      try {
        // Handle image uploads
        if (files.images && files.images.length > 0) {
          for (const file of files.images) {
            const result = await this.uploadFileWithRetry(
              file,
              `produce/${farmer.id}/images`,
              { userId: user.id }
            );
            uploadedImageKeys.push(result.url);
          }
        }

        // Handle video upload
        if (files.video && files.video.length > 0) {
          const videoFile = files.video[0];
          const result = await this.uploadFileWithRetry(
            videoFile,
            `produce/${farmer.id}/videos`,
            { userId: user.id }
          );
          uploadedVideoKeys.push(result.url);
        }

        const produceInput: CreateProduceInput = {
          ...createProduceDto,
          farmer_id: farmer.id,
          images: uploadedImageKeys,
          status: ProduceStatus.PENDING_AI_ASSESSMENT
        };

        // Create produce
        const produce = await this.produceService.create(produceInput);

        // Trigger AI assessment for the first image
        if (files.images && files.images.length > 0) {
          await this.analyzeImageWithRetry(files.images[0], produce.id);
        }

        return produce;
      } catch (error) {
        // Cleanup uploaded files in case of error
        await this.cleanupUploadedFiles([...uploadedImageKeys, ...uploadedVideoKeys]);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  findAll(
    @Query("farm_id") farm_id?: string,
    @Query("status") status?: ProduceStatus,
    @Query("produce_category") produce_category?: ProduceCategory,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Produce>> {
    return this.produceService.findAndPaginate({
      where: {
        ...(farm_id && { farm_id }),
        ...(status && { status }),
        ...(produce_category && { produce_category }),
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  @Get("nearby")
  findNearby(
    @Query("lat", ParseFloatPipe) lat: number,
    @Query("lon", ParseFloatPipe) lon: number,
    @Query("radius", new DefaultValuePipe(10), ParseFloatPipe) radius = 10,
  ): Promise<Produce[]> {
    return this.produceService.findNearby(lat, lon, radius);
  }

  @Get("my")
  async findMyProduce(
    @GetUser() user: User,
    @Query("farm_id") farm_id?: string,
    @Query("status") status?: ProduceStatus,
    @Query("produce_category") produce_category?: ProduceCategory,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Produce>> {
    const farmer = await this.farmerService.findByUserId(user.id);
    if (!farmer) {
      throw new BadRequestException('User is not a farmer');
    }

    return this.produceService.findAndPaginate({
      where: {
        farmer_id: farmer.id,
        ...(farm_id && { farm_id }),
        ...(status && { status }),
        ...(produce_category && { produce_category }),
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.produceService.findById(id);
  }

  @Patch(":id")
  async update(
    @GetUser() user: User,
    @Param("id") id: string,
    @Body() updateProduceDto: UpdateProduceDto,
  ) {
    const produce = await this.produceService.findById(id);
    if (!produce) {
      throw new UnauthorizedException("Produce not found");
    }

    const farmer = await this.farmerService.findByUserId(user.id);
    if (produce.farmer_id !== farmer.id) {
      throw new UnauthorizedException("You can only update your own produce");
    }

    return this.produceService.update(id, updateProduceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a produce' })
  @ApiResponse({ status: 200, description: 'Produce deleted successfully' })
  async remove(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    // Find the produce and verify it exists
    const produce = await this.produceService.findById(id);
    if (!produce) {
      throw new NotFoundException("Produce not found");
    }

    // Verify ownership
    const farmer = await this.farmerService.findByUserId(user.id);
    if (!farmer || produce.farmer_id !== farmer.id) {
      throw new UnauthorizedException("You can only delete your own produce");
    }

    // Delete the produce and its related data
    await this.produceService.deleteById(id);
    return { message: 'Produce deleted successfully' };
  }

  @Post('request-ai-verification')
  async requestAiVerification(
    @GetUser() user: User,
    @Body() requestDto: RequestAiVerificationDto,
  ) {
    // Get the produce
    const produce = await this.produceService.findOne(requestDto.produce_id);

    // Check if produce exists and belongs to the user
    const farmer = await this.farmerService.findByUserId(user.id);
    if (produce.farmer_id !== farmer.id) {
      throw new UnauthorizedException('You can only request verification for your own produce');
    }

    // Check if produce is in a valid state for AI verification
    if (produce.status !== ProduceStatus.ASSESSMENT_FAILED) {
      throw new BadRequestException('AI verification can only be requested for produce with failed assessment');
    }

    // Update produce status
    await this.produceService.update(requestDto.produce_id, {
      status: ProduceStatus.PENDING_AI_ASSESSMENT,
    });

    // Emit event for AI service to pick up
    this.eventEmitter.emit('produce.created', {
      produce_id: produce.id,
      image_url: produce.images[0], // Use the first image for AI assessment
    });

    return { message: 'AI verification requested successfully' };
  }
}
