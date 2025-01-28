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
      this.logger.debug('Create produce request received', {
        hasFiles: !!files,
        imageFiles: files?.images?.map(file => ({
          filename: file.originalname,
          size: `${(file.size / 1024).toFixed(2)}KB`,
          mimetype: file.mimetype
        })),
        produceData: createProduceDto,
        userId: user.id
      });

      // Validate farmer exists
      const farmer = await this.farmerService.findByUserId(user.id);
      if (!farmer) {
        this.logger.error(`Farmer not found for user ID: ${user.id}`);
        throw new BadRequestException('Farmer not found');
      }
      this.logger.debug('Farmer found', { farmerId: farmer.id });

      // Validate at least one image is uploaded
      if (!files?.images || files.images.length === 0) {
        this.logger.error('Image validation failed - no images provided', {
          hasFiles: !!files,
          hasImages: !!files?.images,
          imageCount: files?.images?.length
        });
        throw new BadRequestException('At least one image is required');
      }

      // Validate images
      try {
        const fileValidationPipe = FileValidationPipe.forType(StorageUploadType.IMAGES);
        files.images.forEach((file, index) => {
          this.logger.debug(`Validating image ${index + 1}`, {
            filename: file.originalname,
            size: `${(file.size / 1024).toFixed(2)}KB`,
            mimetype: file.mimetype
          });
          fileValidationPipe.transform(file, { type: 'body', data: 'images' });
        });
      } catch (error) {
        this.logger.error('Image validation error', { 
          error: error.message,
          stack: error.stack 
        });
        throw error;
      }

      // Create produce first (without images)
      const produceInput: CreateProduceInput = {
        ...createProduceDto,
        farmer_id: farmer.id,
        images: [], // Initially empty, will update after upload
        status: ProduceStatus.PENDING_AI_ASSESSMENT
      };

      this.logger.debug('Creating produce record', { produceInput });
      const produce = await this.produceService.create(produceInput);
      this.logger.debug('Produce record created', { produceId: produce.id });

      try {
        this.logger.debug('Starting parallel image upload and AI analysis');
        // Run image uploads and AI analysis in parallel
        const [uploadedImages, aiAnalysis] = await Promise.all([
          // Upload all images
          Promise.all(files.images.map(async (file, index) => {
            try {
              this.logger.debug(`Uploading image ${index + 1}`, {
                filename: file.originalname,
                produceId: produce.id
              });
              const result = await this.uploadFileWithRetry(
                file,
                'produce-images',
                {
                  userId: user.id,
                  farmerId: farmer.id,
                  produceId: produce.id,
                  contentType: file.mimetype,
                }
              );
              this.logger.debug(`Image ${index + 1} uploaded successfully`, {
                url: result.url
              });
              return result.url;
            } catch (error) {
              this.logger.error(`Failed to upload image ${index + 1}`, {
                error: error.message,
                stack: error.stack,
                filename: file.originalname
              });
              throw new InternalServerErrorException(`Failed to upload image: ${error.message}`);
            }
          })),
          // Analyze first image with correct produce ID
          (async () => {
            try {
              this.logger.debug('Starting AI analysis', {
                produceId: produce.id,
                imageFilename: files.images[0].originalname
              });
              const analysis = await this.analyzeImageWithRetry(files.images[0], produce.id);
              this.logger.debug('AI analysis completed', {
                produceId: produce.id,
                qualityGrade: analysis.quality_grade,
                confidenceLevel: analysis.confidence_level
              });
              return analysis;
            } catch (error) {
              this.logger.error('AI analysis failed', {
                error: error.message,
                stack: error.stack,
                produceId: produce.id
              });
              throw error;
            }
          })()
        ]);

        // Update produce with uploaded image URLs
        this.logger.debug('Updating produce with image URLs', {
          produceId: produce.id,
          imageCount: uploadedImages.length
        });
        await this.produceService.update(produce.id, { images: uploadedImages });

        // Emit event for AI verification
        this.logger.debug('Emitting quality assessment completed event', {
          produceId: produce.id,
          qualityGrade: aiAnalysis.quality_grade
        });
        await this.eventEmitter.emit('quality.assessment.completed', {
          produce_id: produce.id,
          quality_grade: aiAnalysis.quality_grade,
          confidence_level: aiAnalysis.confidence_level,
          farmer_id: farmer.id,
          image_analysis: aiAnalysis,
          detected_name: aiAnalysis.name,
          description: aiAnalysis.description,
          product_variety: aiAnalysis.product_variety,
          produce_category: aiAnalysis.produce_category,
          category_specific_attributes: aiAnalysis.category_specific_attributes,
          assessment_details: {
            defects: aiAnalysis.detected_defects,
            recommendations: aiAnalysis.recommendations
          }
        });

        // Return the updated produce
        this.logger.debug('Produce creation completed successfully', { produceId: produce.id });
        return this.produceService.findById(produce.id);
      } catch (error) {
        // If any error occurs during upload or analysis, delete the produce and cleanup
        this.logger.error('Error during upload/analysis phase', {
          error: error.message,
          stack: error.stack,
          produceId: produce.id
        });
        await this.produceService.deleteById(produce.id);
        throw new InternalServerErrorException(`Failed to process produce: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Error in create produce endpoint', {
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create produce: ${error.message}`);
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
