import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export enum AppType {
  BUYER = 'BUYER',
  FARMER = 'FARMER',
  INSPECTOR = 'INSPECTOR',
}

export class UpdateAppVersionDto {
  @IsEnum(AppType)
  app_type: AppType;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Version must be in format x.x.x' })
  @IsOptional()
  min_version?: string;

  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Version must be in format x.x.x' })
  @IsOptional()
  latest_version?: string;

  @IsBoolean()
  @IsOptional()
  force_update?: boolean;

  @IsBoolean()
  @IsOptional()
  maintenance_mode?: boolean;

  @IsString()
  @IsOptional()
  maintenance_message?: string;

  @IsString()
  @IsOptional()
  update_message?: string;

  @IsUrl()
  @IsOptional()
  store_url?: string;
} 