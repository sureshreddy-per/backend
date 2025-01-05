import { IsString, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Mobile number must be in E.164 format (e.g., +1234567890)',
  })
  mobileNumber: string;

  @IsString()
  @Length(6, 6)
  otp: string;
} 