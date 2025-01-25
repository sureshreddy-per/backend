import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Delete,
  Query,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RequestOtpDto, RequestOtpResponseDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { User } from "../users/entities/user.entity";
import { CheckMobileDto, CheckMobileResponseDto } from "./dto/check-mobile.dto";
import { Token } from "./decorators/token.decorator";
import { Public } from "./decorators/public.decorator";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("check-mobile")
  @ApiOperation({ summary: "Check if mobile number is already registered" })
  @ApiResponse({
    status: 200,
    description: "Mobile number registration status",
    type: CheckMobileResponseDto,
  })
  async checkMobile(
    @Body() checkMobileDto: CheckMobileDto,
  ): Promise<CheckMobileResponseDto> {
    return this.authService.checkMobile(checkMobileDto.mobile_number);
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user and send OTP" })
  @ApiResponse({
    status: 201,
    description: "User registered and OTP sent",
    type: RequestOtpResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RequestOtpResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post("otp/request")
  @ApiOperation({ summary: "Request OTP for existing user login" })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully",
    type: RequestOtpResponseDto,
  })
  async requestOtp(
    @Body() requestOtpDto: RequestOtpDto,
  ): Promise<RequestOtpResponseDto> {
    return this.authService.requestOtp(requestOtpDto.mobile_number);
  }

  @Public()
  @Post("otp/verify")
  @ApiOperation({ summary: "Verify OTP and get JWT token" })
  @ApiResponse({
    status: 200,
    description: "OTP verified and JWT token generated",
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.mobile_number,
      verifyOtpDto.otp,
      verifyOtpDto.app_version,
    );
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Logout user and invalidate token" })
  @ApiResponse({
    status: 200,
    description: "Successfully logged out",
  })
  async logout(@Token() token: string) {
    return this.authService.logout(token);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req) {
    return this.authService.deleteAccount(req.user.mobile_number);
  }

  @Get("validate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Validate JWT token and check app version" })
  @ApiQuery({
    name: 'current_version',
    required: false,
    type: String,
    description: 'Current app version in format x.x.x',
  })
  @ApiResponse({
    status: 200,
    description: "Token is valid",
    schema: {
      type: "object",
      properties: {
        valid: { type: "boolean" },
        user: { type: "object" },
        app_status: {
          type: "object",
          properties: {
            needsUpdate: { type: "boolean" },
            forceUpdate: { type: "boolean" },
            maintenanceMode: { type: "boolean" },
            message: { type: "string" },
            storeUrl: { type: "string" },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Token is invalid or expired",
  })
  async validate(
    @Token() token: string,
    @Query('current_version') currentVersion?: string,
  ) {
    return this.authService.validateToken(token, currentVersion);
  }
}
