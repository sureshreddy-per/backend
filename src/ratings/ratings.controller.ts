import { Controller, Get, Post, Body, Param, Delete, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Rating } from './entities/rating.entity';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  create(@GetUser() user: User, @Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create({
      ...createRatingDto,
      rating_user_id: user.id,
    });
  }

  @Get('received')
  findRatingsReceived(@GetUser() user: User) {
    return this.ratingsService.findByRatedUser(user.id);
  }

  @Get('given')
  findRatingsGiven(@GetUser() user: User) {
    return this.ratingsService.findByRatingUser(user.id);
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const rating = await this.ratingsService.findOne(id);

    if (rating.rating_user_id !== user.id && rating.rated_user_id !== user.id) {
      throw new UnauthorizedException('You can only view ratings that you have given or received');
    }

    return rating;
  }

  @Delete(':id')
  async remove(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    const rating = await this.ratingsService.findOne(id);

    if (rating.rating_user_id !== user.id) {
      throw new UnauthorizedException('You can only delete ratings that you have given');
    }

    return this.ratingsService.remove(id);
  }

  @Get('transaction/:transactionId')
  async findByTransaction(
    @GetUser() user: User,
    @Param('transactionId') transactionId: string
  ) {
    const ratings = await this.ratingsService.findByTransaction(transactionId);

    // Filter out ratings that the user is not involved in
    return ratings.filter(rating =>
      rating.rating_user_id === user.id || rating.rated_user_id === user.id
    );
  }
}