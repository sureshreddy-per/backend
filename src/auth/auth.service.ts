import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/services/users.service";
import { BuyersService } from "../buyers/buyers.service";
import { InspectorsService } from "../inspectors/inspectors.service";
import { FarmersService } from "../farmers/farmers.service";
import { RedisService } from "../redis/redis.service";
import { User } from "../users/entities/user.entity";
import { UserStatus } from "../users/enums/user-status.enum";
import { UserRole } from "../enums/user-role.enum";
import * as crypto from "crypto";
import { TwoFactorService } from "../two-factor/two-factor.service";
import { AppVersionService } from "../admin/services/app-version.service";
import { AppType } from "../admin/dto/update-app-version.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly farmersService: FarmersService,
    private readonly buyersService: BuyersService,
    private readonly inspectorsService: InspectorsService,
    private readonly twoFactorService: TwoFactorService,
    private readonly appVersionService: AppVersionService,
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
    let user = null;
    try {
      user = await this.usersService.findByMobileNumber(mobile_number);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      // User not found, return false
      return { isRegistered: false };
    }

    // Consider a user as not registered if they are deleted or don't exist
    return { isRegistered: !!user && user.status !== UserStatus.DELETED };
  }

  async register(userData: {
    mobile_number: string;
    name: string;
    email?: string;
    role: UserRole;
  }): Promise<{ requestId: string; message: string }> {
    let existingUser = null;
    try {
      existingUser = await this.usersService.findByMobileNumber(userData.mobile_number);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      // If user is not found, continue with registration
    }

    // Check if user exists and is not deleted
    if (existingUser) {
      if (existingUser.status !== UserStatus.DELETED) {
        throw new BadRequestException("User already exists");
      }
      // If user exists but is deleted, remove the old record first
      await this.usersService.remove(existingUser.id);
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

    // Generate request ID
    const requestId = Math.random().toString(36).substring(2, 15);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP using Twofatctor
    const otpSent = await this.twoFactorService.sendOTP(userData.mobile_number, otp);

    if (!otpSent) {
      throw new InternalServerErrorException("Failed to send OTP");
    }

    // Check if we should show OTP in response
    const use2FactorValue = this.configService.get<string>("USE_2FACTOR_SERVICE");
    const use2FactorService = use2FactorValue === 'true';

    this.logger.debug(`Generated OTP for ${userData.mobile_number}: ${otp}`);

    return {
      requestId,
      message: use2FactorService
        ? `User registered successfully. OTP sent to ${userData.mobile_number}`
        : `User registered successfully. Development mode - OTP: ${otp}`,
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

      // Send OTP using TwoFactorService
      const otpSent = await this.twoFactorService.sendOTP(mobile_number, otp);
      if (!otpSent) {
        throw new InternalServerErrorException("Failed to send OTP");
      }

      // Check if we should show OTP in response
      const use2FactorValue = this.configService.get<string>("USE_2FACTOR_SERVICE");
      const use2FactorService = use2FactorValue === 'true';
      
      this.logger.debug(`Generated OTP for ${mobile_number}: ${otp}`);
      
      return {
        message: use2FactorService 
          ? `OTP sent successfully to ${mobile_number}`
          : `Development mode - OTP: ${otp}`,
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
    app_version: string,
  ): Promise<{ token: string; user: User }> {
    // Verify OTP using Twofatctor
    const isValid = await this.twoFactorService.verifyOTP(mobile_number, otp);

    if (!isValid) {
      throw new UnauthorizedException("Invalid OTP");
    }

    try {
      const user = await this.usersService.findByMobileNumber(mobile_number);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Always set status to ACTIVE and update app version on successful login
      if (user.status !== UserStatus.ACTIVE || user.app_version !== app_version) {
        await this.usersService.update(user.id, {
          status: UserStatus.ACTIVE,
          app_version: app_version,
          last_login_at: new Date(),
        });
        user.status = UserStatus.ACTIVE;
        user.app_version = app_version;
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

  async validateToken(token: string, currentVersion?: string, appType?: 'FARMER' | 'BUYER' | 'INSPECTOR'): Promise<{ 
    valid: boolean; 
    user?: User;
    app_status?: {
      needsUpdate: boolean;
      forceUpdate: boolean;
      maintenanceMode: boolean;
      message?: string;
      storeUrl?: string;
    };
  }> {
    let app_status = undefined;
    let valid = false;
    let user = undefined;
    
    // First try to get app status if version is provided
    if (currentVersion) {
      try {
        // Use provided app type or default to FARMER
        const initialAppType = appType ? AppType[appType] : AppType.FARMER;
        app_status = await this.appVersionService.checkAppStatus(initialAppType, currentVersion);
      } catch (appError) {
        this.logger.error('Failed to check app status:', appError);
        app_status = {
          needsUpdate: false,
          forceUpdate: false,
          maintenanceMode: false
        };
      }
    }

    // Only try to validate token if one is provided
    if (token) {
      try {
        // Check if token is blacklisted
        const isBlacklisted = await this.isTokenBlacklisted(token);
        if (isBlacklisted) {
          return {
            valid: false,
            app_status
          };
        }

        // Verify the token
        const decoded = this.jwtService.verify(token);

        // Get user information
        user = await this.usersService.findOne(decoded.sub);
        if (!user) {
          return {
            valid: false,
            app_status
          };
        }

        // If we have user info and version is provided, update app status with correct app type
        if (currentVersion) {
          try {
            // Use provided app type or determine from user role
            const userAppType = appType ? AppType[appType] : 
                              user.role === UserRole.BUYER ? AppType.BUYER : 
                              user.role === UserRole.INSPECTOR ? AppType.INSPECTOR : 
                              AppType.FARMER;
            app_status = await this.appVersionService.checkAppStatus(userAppType, currentVersion);
          } catch (appError) {
            this.logger.error('Failed to check app status with user role:', appError);
            // Keep existing app_status from earlier check
          }
        }

        valid = true;
      } catch (error) {
        this.logger.error('Token validation failed:', error);
        // Don't throw error, just return invalid with app status
        return {
          valid: false,
          app_status
        };
      }
    }

    return {
      valid,
      user,
      app_status,
    };
  }

  async deleteAccount(mobile_number: string): Promise<void> {
    const existingUser =
      await this.usersService.findByMobileNumber(mobile_number);
    if (existingUser) {
      await this.usersService.remove(existingUser.id);
    }
  }

  async createBuyerAccount(user: User, userData: any): Promise<User> {
    try {
      await this.buyersService.createBuyer(user.id, {
        business_name: userData.business_name,
        address: userData.address,
        location: userData.location,
      });
      return user;
    } catch (error) {
      this.logger.error(`Error creating buyer account: ${error.message}`, error.stack);
      throw error;
    }
  }
}
