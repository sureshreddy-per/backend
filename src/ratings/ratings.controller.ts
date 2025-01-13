import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  Request,
} from "@nestjs/common";
import { RatingsService } from "./services/ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { Rating } from "./entities/rating.entity";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Ratings")
@ApiBearerAuth()
@Controller("ratings")
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new rating' })
  @ApiResponse({ status: 201, description: 'Rating created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createRating(@GetUser() user: User, @Body() createRatingDto: CreateRatingDto): Promise<Rating> {
    return this.ratingsService.create(createRatingDto, user);
  }

  @Get("received")
  @ApiOperation({ summary: "Get all ratings received by the user" })
  async getReceivedRatings(@GetUser() user: User): Promise<Rating[]> {
    return this.ratingsService.findReceivedRatings(user.id);
  }

  @Get("given")
  @ApiOperation({ summary: "Get all ratings given by the user" })
  async getGivenRatings(@GetUser() user: User): Promise<Rating[]> {
    return this.ratingsService.findGivenRatings(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific rating by ID" })
  async getRating(@Param("id") id: string): Promise<Rating> {
    return this.ratingsService.findOne(id);
  }

  @Get("transaction/:id")
  @ApiOperation({ summary: "Get all ratings for a specific transaction" })
  async getTransactionRatings(@Param("id") transactionId: string): Promise<Rating[]> {
    return this.ratingsService.findByTransaction(transactionId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a rating" })
  async deleteRating(
    @GetUser() user: User,
    @Param("id") id: string,
  ): Promise<void> {
    return this.ratingsService.delete(user.id, id);
  }
}
