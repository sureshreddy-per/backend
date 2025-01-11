import { Controller, Post, Get, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { MediaService } from "../services/media.service";
import { Media, MediaType } from "../entities/media.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";

@Controller("media")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FARMER, UserRole.INSPECTOR)
  async create(
    @Body()
    data: {
      url: string;
      type: MediaType;
      mime_type?: string;
      size?: number;
      original_name?: string;
      metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        thumbnail_url?: string;
      };
    },
  ): Promise<Media> {
    return this.mediaService.create(data);
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Media> {
    return this.mediaService.findOne(id);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async delete(@Param("id") id: string): Promise<void> {
    await this.mediaService.delete(id);
  }
} 