import { IsUUID, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AssignInspectorDto {
  @IsUUID()
  @IsNotEmpty()
  inspector_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason: string;
} 