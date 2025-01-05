import { Controller, Post, Body, UseGuards, Request, Get, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto, RequestOtpResponseDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { CheckMobileDto, CheckMobileResponseDto } from './dto/check-mobile.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-mobile')
  @ApiOperation({ summary: 'Check if mobile number is already registered' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mobile number registration status',
    type: CheckMobileResponseDto
  })
  async checkMobile(@Body() checkMobileDto: CheckMobileDto): Promise<CheckMobileResponseDto> {
    return this.authService.checkMobile(checkMobileDto.mobileNumber);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and send OTP' })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered and OTP sent',
    type: RequestOtpResponseDto
  })
  async register(@Body() registerDto: RegisterDto): Promise<RequestOtpResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('otp/request')
  @ApiOperation({ summary: 'Request OTP for existing user login' })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP sent successfully',
    type: RequestOtpResponseDto 
  })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto): Promise<RequestOtpResponseDto> {
    return this.authService.requestOtp(requestOtpDto.mobileNumber);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and get JWT token' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified and JWT token generated',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.mobileNumber,
      verifyOtpDto.otp
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user and invalidate token' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  async logout(@Request() req) {
    return this.authService.logout(req.token);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req) {
    return this.authService.deleteAccount(req.user.id);
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT token and check expiration' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        user: { type: 'object' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token is invalid or expired'
  })
  async validate(@Request() req) {
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.validateToken(token);
  }
} 