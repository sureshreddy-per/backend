export function isValidQualityGrade(grade: number): boolean {
  return grade >= 0 && grade <= 10;
} 