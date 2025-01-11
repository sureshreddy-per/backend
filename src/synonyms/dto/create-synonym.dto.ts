import { IsString, IsArray } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSynonymDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  words: string[];
}
