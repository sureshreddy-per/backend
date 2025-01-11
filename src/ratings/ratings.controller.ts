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

@Controller("ratings")
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.create(req.user.id, createRatingDto);
  }

  @Get("user/:userId")
  async findByUser(@Param("userId") userId: string): Promise<Rating[]> {
    return this.ratingsService.findByUser(userId);
  }

  @Get("user/:userId/average")
  async getUserAverageRating(@Param("userId") userId: string): Promise<{
    overall: number;
    aspects: {
      quality_accuracy: number;
      communication: number;
      reliability: number;
      timeliness: number;
    };
    total_ratings: number;
  }> {
    return this.ratingsService.getUserAverageRating(userId);
  }
}
