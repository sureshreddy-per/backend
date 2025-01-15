import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateQualityAssessmentDto } from "./create-quality-assessment.dto";

export class UpdateQualityAssessmentDto extends PartialType(
  OmitType(CreateQualityAssessmentDto, ["produce_id"] as const),
) {}
