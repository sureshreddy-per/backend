import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly apiKey: string;
  private readonly templateName: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {
    this.apiKey = this.configService.get<string>("TWO_FACTOR_API_KEY");
    this.templateName = this.configService.get<string>("TWO_FACTOR_TEMPLATE_NAME") || "AgriMarket";

    if (!this.apiKey) {
      this.logger.warn("2Factor API key not found");
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn("2Factor client not initialized. Simulating OTP send.");
      this.logger.debug(`Would have sent OTP ${otp} to ${phoneNumber}`);
      return true;
    }

    try {
      // Remove any '+' prefix from the phone number
      const cleanPhoneNumber = phoneNumber.replace('+91', '');

      // Send OTP using 2Factor API
      const response = await this.httpService.get(
        `https://2factor.in/API/V1/${this.apiKey}/SMS/${cleanPhoneNumber}/${otp}/${this.templateName}`
      ).toPromise();

      const status = response?.data?.Status;
      this.logger.debug(`2Factor API response status: ${status}`);
      
      return status === "Success";
    } catch (error) {
      this.logger.error("Failed to send OTP:", error);
      return false;
    }
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn("2Factor client not initialized. Simulating OTP verification.");
      this.logger.debug(`Would have verified OTP ${code} for ${phoneNumber}`);
      return true;
    }

    // For 2Factor.in, we don't need to verify the OTP through their API
    // The OTP verification is handled by our own backend using Redis
    return true;
  }
}
