import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from 'rxjs';
import * as crypto from "crypto";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly apiKey: string;
  private readonly templateName: string;
  private readonly use2FactorService: boolean;

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService,
    private readonly redisService: RedisService
  ) {
    this.apiKey = this.configService.get<string>("TWO_FACTOR_API_KEY");
    this.templateName = this.configService.get<string>("TWO_FACTOR_TEMPLATE_NAME") || "AgriMarket";
    const use2FactorValue = this.configService.get<string>("USE_2FACTOR_SERVICE");
    this.use2FactorService = use2FactorValue === 'true';

    if (this.use2FactorService && !this.apiKey) {
      this.logger.error('2Factor API key not configured');
      throw new Error('2Factor API key not configured');
    }
  }

  private hashOtp(otp: string, phoneNumber: string): string {
    // Create a unique salt using phone number
    const salt = crypto
      .createHash("sha256")
      .update(phoneNumber)
      .digest("hex");
    // Hash OTP with salt
    return crypto
      .createHash("sha256")
      .update(otp + salt)
      .digest("hex");
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Format phone number to international format
      let cleanPhoneNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
      if (!cleanPhoneNumber.startsWith('91')) {
        cleanPhoneNumber = '91' + cleanPhoneNumber;
      }
      const internationalNumber = '+' + cleanPhoneNumber;

      // If 2Factor service is disabled, just store the OTP in Redis
      if (!this.use2FactorService) {
        this.logger.debug(`2Factor service is disabled. Storing OTP locally. OTP for ${internationalNumber}: ${otp}`);
        const hashedOtp = this.hashOtp(otp, phoneNumber);
        await this.redisService.set(`otp:${phoneNumber}`, hashedOtp, 300); // 5 minutes expiry
        return true;
      }
      
      const url = `https://2factor.in/API/V1/${this.apiKey}/SMS/${internationalNumber}/${otp}/${this.templateName}`;
      this.logger.debug(`Attempting to send OTP with:
        Phone: ${internationalNumber}
        Template: ${this.templateName}
        API Key: ${this.apiKey.substring(0, 8)}...
        URL: ${url}
      `);

      // Send OTP using 2Factor API
      const response = await firstValueFrom(this.httpService.get(url));
      
      this.logger.debug('Full API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      const status = response?.data?.Status;
      const details = response?.data?.Details;
      this.logger.debug(`2Factor API response status: ${status}, Details: ${details}`);

      // If OTP sent successfully, store hashed OTP in Redis
      if (status === "Success") {
        const hashedOtp = this.hashOtp(otp, phoneNumber);
        await this.redisService.set(`otp:${phoneNumber}`, hashedOtp, 300); // 5 minutes expiry
      } else {
        this.logger.error(`2Factor API returned non-success status: ${status}`);
        return false;
      }
      
      return status === "Success";
    } catch (error) {
      this.logger.error("Failed to send OTP. Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        headers: error.response?.headers
      });
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      // Get stored hashed OTP from Redis
      const storedHashedOtp = await this.redisService.get(`otp:${phoneNumber}`);
      if (!storedHashedOtp) {
        this.logger.warn(`No OTP found for ${phoneNumber} or OTP expired`);
        throw new UnauthorizedException('OTP expired or invalid');
      }

      // Hash the received OTP
      const hashedInputOtp = this.hashOtp(code, phoneNumber);

      // Compare hashes
      const isValid = storedHashedOtp === hashedInputOtp;

      if (isValid) {
        // Delete the OTP from Redis after successful verification
        await this.redisService.del(`otp:${phoneNumber}`);
      } else {
        this.logger.warn(`Invalid OTP attempt for ${phoneNumber}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('OTP verification failed:', error);
      throw new UnauthorizedException('OTP verification failed');
    }
  }
}
