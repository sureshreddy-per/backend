import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/services/users.service";
import { User, UserStatus } from "../users/entities/user.entity";
import { UserRole } from "../enums/user-role.enum";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";
import { FarmersService } from "../farmers/farmers.service";
import { BuyersService } from "../buyers/buyers.service";
import { InspectorsService } from "../inspectors/inspectors.service";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly farmersService: FarmersService,
    private readonly buyersService: BuyersService,
    private readonly inspectorsService: InspectorsService,
  ) {}

  private hashOtp(otp: string, mobile_number: string): string {
    // Create a unique salt using mobile number to prevent rainbow table attacks
    const salt = crypto
      .createHash("sha256")
      .update(mobile_number)
      .digest("hex");
    // Hash OTP with salt using SHA-256
    return crypto
      .createHash("sha256")
      .update(otp + salt)
      .digest("hex");
  }

  async checkMobile(mobile_number: string): Promise<{ isRegistered: boolean }> {
    try {
      const user = await this.usersService.findByMobileNumber(mobile_number);
      // Consider a user as not registered if they are deleted
      return { isRegistered: !!user && user.status !== UserStatus.DELETED };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { isRegistered: false };
      }
      throw error;
    }
  }

  async register(userData: {
    mobile_number: string;
    name: string;
    email?: string;
    role: UserRole;
  }): Promise<{ requestId: string; message: string }> {
    try {
      const existingUser = await this.usersService.findByMobileNumber(
        userData.mobile_number,
      );

      // Check if user exists and is not deleted
      if (existingUser && existingUser.status !== UserStatus.DELETED) {
        throw new BadRequestException("User already exists");
      }

      // If user exists but is deleted, remove the old record first
      if (existingUser && existingUser.status === UserStatus.DELETED) {
        await this.usersService.remove(existingUser.id);
      }
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      // If user is not found, continue with registration
    }

    // Create user with pending verification status
    const user = await this.usersService.create({
      ...userData,
      status: UserStatus.PENDING_VERIFICATION,
    });

    // If user has FARMER role, create farmer profile
    if (userData.role === UserRole.FARMER) {
      await this.farmersService.createFarmer(user.id);
    }

    // If user has BUYER role, create buyer profile
    if (userData.role === UserRole.BUYER) {
      await this.buyersService.createBuyer(user.id, {
        business_name: userData.name,
        address: "Default Address",
      });
    }

    // If user has INSPECTOR role, create inspector profile
    if (userData.role === UserRole.INSPECTOR) {
      await this.inspectorsService.create({
        name: user.name,
        mobile_number: user.mobile_number,
        location: "0.0,0.0",
        user_id: user.id,
      });
    }

    // Generate OTP and request ID
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const requestId = Math.random().toString(36).substring(2, 15);

    // Hash OTP before storing
    const hashedOtp = this.hashOtp(otp, userData.mobile_number);

    // Store hashed OTP in Redis with expiration
    await this.redisService.set(
      `otp:${userData.mobile_number}`,
      hashedOtp,
      300,
    ); // 5 minutes expiry

    // For development, include OTP in message
    return {
      requestId,
      message: `User registered successfully. OTP sent: ${otp}`,
    };
  }

  async requestOtp(
    mobile_number: string,
  ): Promise<{ message: string; requestId: string }> {
    try {
      const user = await this.usersService.findByMobileNumber(mobile_number);
      if (!user) {
        throw new BadRequestException("User not found. Please register first.");
      }

      // Generate OTP and request ID
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const requestId = Math.random().toString(36).substring(2, 15);

      // Hash OTP before storing
      const hashedOtp = this.hashOtp(otp, mobile_number);

      // Store hashed OTP in Redis with expiration
      await this.redisService.set(`otp:${mobile_number}`, hashedOtp, 300); // 5 minutes expiry

      // For development, return the OTP in the message
      return {
        message: `OTP sent successfully: ${otp}`,
        requestId,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException("User not found. Please register first.");
      }
      throw error;
    }
  }

  async verifyOtp(
    mobile_number: string,
    otp: string,
  ): Promise<{ token: string; user: User }> {
    const storedHashedOtp = await this.redisService.get(`otp:${mobile_number}`);

    if (!storedHashedOtp) {
      throw new UnauthorizedException("OTP expired or not found");
    }

    // Hash the received OTP and compare with stored hash
    const hashedInputOtp = this.hashOtp(otp, mobile_number);
    if (hashedInputOtp !== storedHashedOtp) {
      throw new UnauthorizedException("Invalid OTP");
    }

    // Delete the used OTP
    await this.redisService.del(`otp:${mobile_number}`);

    try {
      const user = await this.usersService.findByMobileNumber(mobile_number);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Always set status to ACTIVE on successful login
      if (user.status !== UserStatus.ACTIVE) {
        await this.usersService.updateStatus(user.id, UserStatus.ACTIVE);
        user.status = UserStatus.ACTIVE;
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        mobile_number: user.mobile_number,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);

      return { token, user };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException("User not found");
      }
      throw error;
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const decoded = this.jwtService.verify(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = exp - now;

      if (ttl > 0) {
        // Add token to blacklist
        await this.redisService.set(`blacklist:${token}`, "true", ttl);

        // Update user status to INACTIVE
        await this.usersService.updateStatus(decoded.sub, UserStatus.INACTIVE);
      }

      return { message: "Successfully logged out" };
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
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
        throw new UnauthorizedException("Token has been invalidated");
      }

      // Verify the token
      const decoded = this.jwtService.verify(token);

      // Get user information
      const user = await this.usersService.findOne(decoded.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return {
        valid: true,
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async deleteAccount(mobile_number: string): Promise<void> {
    const existingUser =
      await this.usersService.findByMobileNumber(mobile_number);
    if (existingUser) {
      await this.usersService.remove(existingUser.id);
    }
  }
}
