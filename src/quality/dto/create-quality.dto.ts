import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class QualityParameter {
  @ApiProperty()
  @IsNotEmpty()
  weight: number;

  @ApiProperty()
  @IsNotEmpty()
  maxScore: number;

  @ApiProperty()
  @IsString()
  description: string;
}

export class CreateQualityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  produceType: string;

  @ApiProperty({
    type: 'object',
    example: {
      moisture: { weight: 2, maxScore: 10, description: 'Moisture content' },
      color: { weight: 1, maxScore: 5, description: 'Color uniformity' },
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => QualityParameter)
  params: Record<string, QualityParameter>;
} 