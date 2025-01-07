import { PartialType } from '@nestjs/swagger';
import { CreateQualityAssessmentDto } from './create-quality-assessment.dto';

export class UpdateQualityAssessmentDto extends PartialType(CreateQualityAssessmentDto) {} 