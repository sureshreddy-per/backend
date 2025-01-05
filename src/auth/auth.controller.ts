import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body('mobileNumber') mobileNumber: string) {
    return this.authService.requestOtp(mobileNumber);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('mobileNumber') mobileNumber: string,
    @Body('otp') otp: string,
  ) {
    return this.authService.verifyOtp(mobileNumber, otp);
  }

  @Post('register')
  async register(
    @Body('mobileNumber') mobileNumber: string,
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('role') role: UserRole,
  ) {
    return this.authService.register({
      mobileNumber,
      name,
      email,
      roles: [role],
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('users')
  @Roles([UserRole.ADMIN])
  async getUsers() {
    return this.authService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('users/:id')
  @Roles([UserRole.ADMIN])
  async getUser(@Param('id') id: string) {
    return this.authService.getUser(id);
  }
} 