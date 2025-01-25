import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "../services/users.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../enums/user-role.enum";
import { UpdateUserDto } from "../dto/update-user.dto";
import { BlockUserDto } from "../dto/block-user.dto";
import { ScheduleDeletionDto } from "../dto/schedule-deletion.dto";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../entities/user.entity";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get("role/:role")
  @Roles(UserRole.ADMIN)
  async findByRole(@Param("role") role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Put("profile")
  async update(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Put("verify")
  @Roles(UserRole.ADMIN)
  async verifyUser(@GetUser() user: User) {
    return this.usersService.verifyUser(user.id);
  }

  @Post("block")
  @Roles(UserRole.ADMIN)
  async blockUser(@GetUser() user: User, @Body() blockUserDto: BlockUserDto) {
    return this.usersService.blockUser(user.id, blockUserDto.reason);
  }

  @Post("unblock")
  @Roles(UserRole.ADMIN)
  async unblockUser(@GetUser() user: User) {
    return this.usersService.unblockUser(user.id);
  }

  @Post("schedule-deletion")
  @Roles(UserRole.ADMIN)
  async scheduleDeletion(
    @GetUser() user: User,
    @Body() scheduleDeletionDto: ScheduleDeletionDto,
  ) {
    return this.usersService.scheduleForDeletion(
      user.id,
      scheduleDeletionDto.daysUntilDeletion,
    );
  }

  @Post("cancel-deletion")
  @Roles(UserRole.ADMIN)
  async cancelDeletion(@GetUser() user: User) {
    return this.usersService.cancelDeletionSchedule(user.id);
  }

  @Put("fcm-token")
  async updateFCMToken(
    @GetUser() user: User,
    @Body("fcm_token") fcmToken: string,
  ) {
    return this.usersService.updateFCMToken(user.id, fcmToken);
  }

  @Put("avatar")
  async updateAvatar(
    @GetUser() user: User,
    @Body("avatar_url") avatarUrl: string,
  ) {
    return this.usersService.updateAvatar(user.id, avatarUrl);
  }
}
