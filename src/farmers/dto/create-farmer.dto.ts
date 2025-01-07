import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFarmerDto {
  @ApiProperty()
  @IsUUID()
  user_id: string;
} 