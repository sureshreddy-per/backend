export enum QualityGrade {
  GRADE_10 = 10,
  GRADE_9 = 9,
  GRADE_8 = 8,
  GRADE_7 = 7,
  GRADE_6 = 6,
  GRADE_5 = 5,
  GRADE_4 = 4,
  GRADE_3 = 3,
  GRADE_2 = 2,
  GRADE_1 = 1,
  PENDING = 0,
  REJECTED = -1,
  ASSESSMENT_FAILED = -2
}

export function isValidQualityGrade(grade: number): boolean {
  return Number.isInteger(grade) && grade >= -2 && grade <= 10;
}

export function getQualityGradeLabel(grade: number): string {
  if (!isValidQualityGrade(grade)) {
    throw new Error(`Invalid quality grade: ${grade}`);
  }

  switch (grade) {
    case -2:
      return 'Assessment Failed';
    case -1:
      return 'Rejected';
    case 0:
      return 'Pending';
    default:
      return `Grade ${grade}`;
  }
}

export type QualityGradeType = typeof QualityGrade[keyof typeof QualityGrade];
