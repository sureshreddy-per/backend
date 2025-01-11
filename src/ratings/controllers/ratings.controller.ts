import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import { RatingsService } from "../services/ratings.service";
import { CreateRatingDto } from "../dto/create-rating.dto";

@ApiTags("Ratings")
@ApiBearerAuth()
@Controller("ratings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiOperation({ summary: "Submit a rating for a completed transaction" })
  @ApiResponse({ status: 201, description: "Rating submitted successfully" })
  async createRating(
    @GetUser() user: User,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create(user.id, createRatingDto);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get all ratings for a user" })
  async getUserRatings(@Param("userId") userId: string) {
    return this.ratingsService.findByUser(userId);
  }

  @Get("user/:userId/average")
  @ApiOperation({ summary: "Get average rating for a user" })
  async getUserAverageRating(@Param("userId") userId: string) {
    return this.ratingsService.getUserAverageRating(userId);
  }
}
