import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Offers')
@ApiBearerAuth()
@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Create offer',
    description: 'Creates a new offer for a produce listing. Only accessible by users with the BUYER role.'
  })
  @ApiBody({
    type: CreateOfferDto,
    description: 'Offer details including produce ID, quoted price, and other specifications'
  })
  @ApiResponse({
    status: 201,
    description: 'The offer has been successfully created',
    type: Offer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid offer data or produce not available'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Referenced produce does not exist'
  })
  async create(
    @Body() createOfferDto: CreateOfferDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Offer> {
    return this.offersService.create(createOfferDto, buyerId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all offers',
    description: 'Retrieves a paginated list of all offers. Only accessible by administrators.'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'produceId',
    description: 'Filter offers by produce ID (UUID)',
    required: false,
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'List of offers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Offer' }
        },
        meta: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              description: 'Total number of offers'
            },
            page: {
              type: 'number',
              description: 'Current page number'
            },
            limit: {
              type: 'number',
              description: 'Number of items per page'
            },
            totalPages: {
              type: 'number',
              description: 'Total number of pages'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin privileges'
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('produceId') produceId?: string,
    @CurrentUser() user?: { id: string; role: Role },
  ) {
    if (produceId) {
      return this.offersService.findByProduce(produceId, page, limit);
    }
    return this.offersService.findAll(page, limit);
  }

  @Get('my-offers')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Get own offers',
    description: 'Retrieves a paginated list of offers made by the authenticated buyer.'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Buyer\'s offers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        offers: {
          type: 'array',
          items: { $ref: '#/components/schemas/Offer' }
        },
        total: {
          type: 'number',
          description: 'Total number of offers'
        },
        page: {
          type: 'number',
          description: 'Current page number'
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages'
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  async findMyOffers(
    @CurrentUser('id') buyerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.offersService.findByBuyer(buyerId, page, limit);
  }

  @Get('produce/:produceId')
  @ApiOperation({
    summary: 'Get offers by produce',
    description: 'Retrieves a paginated list of offers for a specific produce listing.'
  })
  @ApiParam({
    name: 'produceId',
    description: 'Unique identifier of the produce listing',
    type: 'string',
    format: 'uuid'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Offers for the produce listing retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        offers: {
          type: 'array',
          items: { $ref: '#/components/schemas/Offer' }
        },
        total: {
          type: 'number',
          description: 'Total number of offers'
        },
        page: {
          type: 'number',
          description: 'Current page number'
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Produce listing does not exist'
  })
  async findByProduce(
    @Param('produceId', ParseUUIDPipe) produceId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.offersService.findByProduce(produceId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get offer by ID',
    description: 'Retrieves detailed information about a specific offer.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the offer',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Offer retrieved successfully',
    type: Offer
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Offer with provided ID does not exist'
  })
  async findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Update offer',
    description: 'Updates an existing offer. Buyers can only update their own pending offers.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the offer to update',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateOfferDto,
    description: 'Updated offer information'
  })
  @ApiResponse({
    status: 200,
    description: 'Offer updated successfully',
    type: Offer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot update non-pending offers'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to update this offer'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Offer does not exist'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfferDto: UpdateOfferDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<Offer> {
    return this.offersService.update(id, updateOfferDto, currentUserId);
  }

  @Put(':id/accept')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Accept offer',
    description: 'Accepts a pending offer. Only accessible by the farmer who owns the produce.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the offer',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Offer accepted successfully',
    type: Offer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot accept non-pending offers'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to accept this offer'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Offer does not exist'
  })
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.offersService.acceptOffer(id, user.id);
  }

  @Put(':id/reject')
  @Roles(Role.FARMER)
  @ApiOperation({
    summary: 'Reject offer',
    description: 'Rejects a pending offer. Only accessible by the farmer who owns the produce.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the offer',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Offer rejected successfully',
    type: Offer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot reject non-pending offers'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to reject this offer'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Offer does not exist'
  })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.offersService.rejectOffer(id, user.id);
  }

  @Post('auto-create')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Auto-create offer',
    description: 'Automatically creates an offer based on produce quality grade and market data.'
  })
  @ApiBody({
    type: CreateOfferDto,
    description: 'Offer details with quality grade information'
  })
  @ApiResponse({
    status: 201,
    description: 'Offer auto-created successfully',
    type: Offer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data or produce not available'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Referenced produce or quality grade does not exist'
  })
  async autoCreate(
    @Body() createOfferDto: CreateOfferDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.offersService.autoCreateOffer(
      user.id,
      createOfferDto.produceId,
      createOfferDto.gradeUsed,
      createOfferDto.quotedPrice,
    );
  }

  @Put(':id/override')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Override auto-generated offer',
    description: 'Overrides the price of an auto-generated offer with manual adjustments.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the offer',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['newPrice', 'overrideReason'],
      properties: {
        newPrice: {
          type: 'number',
          description: 'New price for the offer'
        },
        overrideReason: {
          type: 'string',
          description: 'Reason for overriding the auto-generated price'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Offer price overridden successfully',
    type: Offer
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot override non-pending offers'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to override this offer'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Offer does not exist'
  })
  async override(
    @Param('id') id: string,
    @Body('newPrice') newPrice: number,
    @Body('overrideReason') overrideReason: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.offersService.overrideOffer(id, user.id, newPrice, overrideReason);
  }
} 