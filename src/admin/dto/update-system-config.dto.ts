import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateSystemConfigDto {
  @IsBoolean()
  @IsOptional()
  maintenance_mode?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  max_file_size_mb?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  default_pagination_limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  cache_ttl_minutes?: number;
}
