import { IsString, IsNotEmpty } from "class-validator";

export class BlockUserDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
