import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp(mobileNumber: string): Promise<{ message: string }> {
    // In a real application, integrate with SMS service like Twilio
    // For now, just generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis with expiration
    // await this.redisService.set(`otp:${mobileNumber}`, otp, 300); // 5 minutes expiry

    // For development, just return the OTP
    return { message: `OTP sent successfully: ${otp}` };
  }

  async verifyOtp(mobileNumber: string, otp: string): Promise<{ token: string }> {
    // In a real application, verify OTP from Redis
    // const storedOtp = await this.redisService.get(`otp:${mobileNumber}`);
    // if (!storedOtp || storedOtp !== otp) {
    //   throw new UnauthorizedException('Invalid OTP');
    // }

    // For development, accept any OTP
    let user = await this.usersService.findByMobileNumber(mobileNumber);
    
    if (!user) {
      // Create a new user with pending verification
      user = await this.usersService.create({
        mobileNumber,
        status: UserStatus.PENDING_VERIFICATION,
      });
    }

    // Generate JWT token
    const payload = { sub: user.id, mobileNumber: user.mobileNumber, roles: user.roles };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async register(userData: {
    mobileNumber: string;
    name: string;
    email: string;
    roles: UserRole[];
  }): Promise<User> {
    const existingUser = await this.usersService.findByMobileNumber(userData.mobileNumber);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    return this.usersService.create({
      ...userData,
      status: UserStatus.ACTIVE,
    });
  }

  async getUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  async getUser(id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
} 