import { IsString, IsNotEmpty, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssessQualityDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  qualityId: string;

  @ApiProperty({
    description: 'Quality parameters with their values',
    example: {
      moisture: 8.5,
      color: 4.2,
    },
  })
  @IsObject()
  parameters: Record<string, number>;
} 