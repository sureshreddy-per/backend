import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsUrl,
} from "class-validator";
import { ProduceStatus } from "../enums/produce-status.enum";

export class UpdateProduceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsEnum(ProduceStatus)
  status?: ProduceStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsString()
  assigned_inspector?: string;
}
