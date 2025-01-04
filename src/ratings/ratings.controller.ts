import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rating' })
  @ApiResponse({ status: 201, description: 'Rating created successfully' })
  async create(
    @Body() createRatingDto: CreateRatingDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.ratingsService.create(createRatingDto, user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get ratings for a user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.ratingsService.findByUser(userId, page, limit);
  }

  @Get('offer/:offerId')
  @ApiOperation({ summary: 'Get ratings for an offer' })
  async findByOffer(@Param('offerId') offerId: string) {
    return this.ratingsService.findByOffer(offerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rating by ID' })
  @ApiResponse({ status: 200, description: 'Returns the rating' })
  async findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(id);
  }

  @Get('average/:userId')
  @ApiOperation({ summary: 'Get average rating for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the average rating and total number of ratings',
  })
  async getAverageRating(@Param('userId') userId: string) {
    return this.ratingsService.getAverageRating(userId);
  }
} 