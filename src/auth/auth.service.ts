import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { FarmersService } from '../farmers/farmers.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly farmersService: FarmersService,
  ) {}

  private hashOtp(otp: string, mobileNumber: string): string {
    // Create a unique salt using mobile number to prevent rainbow table attacks
    const salt = crypto.createHash('sha256').update(mobileNumber).digest('hex');
    // Hash OTP with salt using SHA-256
    return crypto.createHash('sha256').update(otp + salt).digest('hex');
  }

  async checkMobile(mobileNumber: string): Promise<{ isRegistered: boolean }> {
    const user = await this.usersService.findByMobileNumber(mobileNumber);
    // Consider a user as not registered if they are deleted
    return { isRegistered: !!user && user.status !== UserStatus.DELETED };
  }

  async register(userData: {
    mobileNumber: string;
    name: string;
    email?: string;
    roles: UserRole[];
  }): Promise<{ requestId: string; message: string }> {
    const existingUser = await this.usersService.findByMobileNumber(userData.mobileNumber);
    
    // Check if user exists and is not deleted
    if (existingUser && existingUser.status !== UserStatus.DELETED) {
      throw new BadRequestException('User already exists');
    }

    // If user exists but is deleted, remove the old record first
    if (existingUser && existingUser.status === UserStatus.DELETED) {
      await this.usersService.remove(existingUser);
    }

    // Create user with pending verification status
    const user = await this.usersService.create({
      ...userData,
      status: UserStatus.PENDING_VERIFICATION,
    });

    // If user has FARMER role, create farmer profile
    if (userData.roles.includes(UserRole.FARMER)) {
      await this.farmersService.createFromUser({
        id: user.id,
        name: userData.name,
        phone: userData.mobileNumber,
        email: userData.email
      });
    }

    // Generate OTP and request ID
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Hash OTP before storing
    const hashedOtp = this.hashOtp(otp, userData.mobileNumber);
    
    // Store hashed OTP in Redis with expiration
    await this.redisService.set(`otp:${userData.mobileNumber}`, hashedOtp, 300); // 5 minutes expiry

    // For development, include OTP in message
    return { 
      requestId,
      message: `User registered successfully. OTP sent: ${otp}`
    };
  }

  async requestOtp(mobileNumber: string): Promise<{ message: string; requestId: string }> {
    const user = await this.usersService.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new BadRequestException('User not found. Please register first.');
    }
    
    // Generate OTP and request ID
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Hash OTP before storing
    const hashedOtp = this.hashOtp(otp, mobileNumber);
    
    // Store hashed OTP in Redis with expiration
    await this.redisService.set(`otp:${mobileNumber}`, hashedOtp, 300); // 5 minutes expiry

    // For development, return the OTP in the message
    return { 
      message: `OTP sent successfully: ${otp}`,
      requestId
    };
  }

  async verifyOtp(mobileNumber: string, otp: string): Promise<{ token: string; user: User }> {
    const storedHashedOtp = await this.redisService.get(`otp:${mobileNumber}`);
    
    if (!storedHashedOtp) {
      throw new UnauthorizedException('OTP expired or not found');
    }

    // Hash the received OTP and compare with stored hash
    const hashedInputOtp = this.hashOtp(otp, mobileNumber);
    if (hashedInputOtp !== storedHashedOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Delete the used OTP
    await this.redisService.del(`otp:${mobileNumber}`);

    const user = await this.usersService.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Always set status to ACTIVE on successful login
    if (user.status !== UserStatus.ACTIVE) {
      await this.usersService.updateStatus(user.id, UserStatus.ACTIVE);
      user.status = UserStatus.ACTIVE;
    }

    // Generate JWT token
    const payload = { sub: user.id, mobileNumber: user.mobileNumber, roles: user.roles };
    const token = this.jwtService.sign(payload);

    return { token, user };
  }

  async logout(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = this.jwtService.verify(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = exp - now;

      if (ttl > 0) {
        // Add token to blacklist
        await this.redisService.set(`blacklist:${token}`, 'true', ttl);
        
        // Update user status to INACTIVE
        await this.usersService.updateStatus(decoded.sub, UserStatus.INACTIVE);
      }

      return { message: 'Successfully logged out' };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.redisService.get(`blacklist:${token}`);
    return !!blacklisted;
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      // Verify the token
      const decoded = this.jwtService.verify(token);
      
      // Get user information
      const user = await this.usersService.findOne(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        valid: true,
        user
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Set deletion schedule date (30 days from now)
    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

    // Invalidate all existing tokens
    const token = await this.jwtService.sign({ sub: userId });
    await this.logout(token);

    // Update user status and set scheduled deletion date
    await this.usersService.update(userId, {
      status: UserStatus.DELETED,
      scheduledForDeletionAt: scheduledDeletionDate
    });

    return { message: 'Account scheduled for deletion. Data will be permanently removed after 30 days.' };
  }
} 