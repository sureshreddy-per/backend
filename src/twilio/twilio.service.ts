import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import twilio, { Twilio } from "twilio";

@Injectable()
export class TwilioService {
  private client: Twilio | null = null;
  private readonly logger = new Logger(TwilioService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>("TWILIO_ACCOUNT_SID");
    const authToken = this.configService.get<string>("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      this.logger.warn("Twilio credentials not found");
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
    } catch (error) {
      this.logger.error("Failed to initialize Twilio client:", error);
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn("Twilio client not initialized. Simulating OTP send.");
      this.logger.debug(`Would have sent OTP ${otp} to ${phoneNumber}`);
      return true;
    }

    try {
      const message = await this.client.messages.create({
        body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
        from: this.configService.get<string>("TWILIO_PHONE_NUMBER"),
        to: phoneNumber,
      });

      return !!message.sid;
    } catch (error) {
      this.logger.error("Failed to send OTP:", error);
      return false;
    }
  }
}
