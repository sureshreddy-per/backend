import { IsNotEmpty, IsNumber, Min, Max, IsEnum, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { SystemConfigKey } from "../enums/system-config-key.enum";

export class UpdateSystemConfigDto {
  @ApiProperty({ description: "Configuration key to update" })
  @IsNotEmpty()
  @IsEnum(SystemConfigKey)
  key: SystemConfigKey;

  @ApiProperty({ description: "New value for the configuration" })
  @IsNotEmpty()
  value: any;
}

export class UpdateMaxDailyPriceUpdatesDto {
  @ApiProperty({
    description: "Maximum number of price updates allowed per day (1-10)",
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  value: number;
}
