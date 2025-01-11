import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateInspectorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile_number: string;

  @IsString()
  @IsOptional()
  location?: string;
}
