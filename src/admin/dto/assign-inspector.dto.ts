import { IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';

export enum InspectionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class AssignInspectorDto {
  @IsUUID()
  @IsNotEmpty()
  inspector_id: string;

  @IsEnum(InspectionPriority)
  @IsNotEmpty()
  priority: InspectionPriority;

  @IsString()
  @IsNotEmpty()
  notes: string;
} 