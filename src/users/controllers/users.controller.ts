import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { UpdateUserDto } from '../dto/update-user.dto';
import { BlockUserDto } from '../dto/block-user.dto';
import { ScheduleDeletionDto } from '../dto/schedule-deletion.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  async findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/verify')
  @Roles(UserRole.ADMIN)
  async verifyUser(@Param('id') id: string) {
    return this.usersService.verifyUser(id);
  }

  @Post(':id/block')
  @Roles(UserRole.ADMIN)
  async blockUser(@Param('id') id: string, @Body() blockUserDto: BlockUserDto) {
    return this.usersService.blockUser(id, blockUserDto.reason);
  }

  @Post(':id/unblock')
  @Roles(UserRole.ADMIN)
  async unblockUser(@Param('id') id: string) {
    return this.usersService.unblockUser(id);
  }

  @Post(':id/schedule-deletion')
  @Roles(UserRole.ADMIN)
  async scheduleDeletion(
    @Param('id') id: string,
    @Body() scheduleDeletionDto: ScheduleDeletionDto,
  ) {
    return this.usersService.scheduleForDeletion(id, scheduleDeletionDto.daysUntilDeletion);
  }

  @Post(':id/cancel-deletion')
  @Roles(UserRole.ADMIN)
  async cancelDeletion(@Param('id') id: string) {
    return this.usersService.cancelDeletionSchedule(id);
  }

  @Put(':id/fcm-token')
  async updateFCMToken(@Param('id') id: string, @Body('fcm_token') fcmToken: string) {
    return this.usersService.updateFCMToken(id, fcmToken);
  }

  @Put(':id/avatar')
  async updateAvatar(@Param('id') id: string, @Body('avatar_url') avatarUrl: string) {
    return this.usersService.updateAvatar(id, avatarUrl);
  }
} 