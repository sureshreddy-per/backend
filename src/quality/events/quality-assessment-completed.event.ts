export class QualityAssessmentCompletedEvent {
  constructor(
    public readonly produce_id: string,
    public readonly quality_grade: number,
    public readonly confidence_level: number,
    public readonly assessment_id: string,
    public readonly source: string,
  ) {}
} 