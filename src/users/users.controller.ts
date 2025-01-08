import { Controller, Get, Post, Put, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<PaginatedResponse<User>> {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@GetUser() user: User): Promise<User> {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<User> {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new UnauthorizedException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  @Put(':id/verify')
  @Roles(UserRole.ADMIN)
  async verifyUser(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ): Promise<User> {
    return this.usersService.updateStatus(id, status);
  }

  @Put(':id/roles')
  @Roles(UserRole.ADMIN)
  async updateRoles(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Body('action') action: 'add' | 'remove',
  ): Promise<User> {
    if (action === 'add') {
      return this.usersService.addRole(id, role);
    } else {
      return this.usersService.removeRole(id, role);
    }
  }

  @Put(':id/block')
  @Roles(UserRole.ADMIN)
  async blockUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<User> {
    return this.usersService.block(id, reason);
  }

  @Put(':id/unblock')
  @Roles(UserRole.ADMIN)
  async unblockUser(@Param('id') id: string): Promise<User> {
    return this.usersService.unblock(id);
  }
}