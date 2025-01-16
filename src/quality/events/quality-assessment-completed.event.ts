export class QualityAssessmentCompletedEvent {
  constructor(
    public readonly produce_id: string,
    public readonly quality_grade: number,
    public readonly confidence_level: number,
    public readonly detected_name: string,
    public readonly description?: string,
    public readonly product_variety?: string,
    public readonly produce_category?: string,
    public readonly category_specific_attributes?: Record<string, any>,
    public readonly assessment_details?: any
  ) {}
} 