import { HttpException, HttpStatus } from '@nestjs/common';

export class InspectionNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Inspection with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InspectionAlreadyCompletedException extends HttpException {
  constructor(id: string) {
    super(`Inspection with ID ${id} is already completed`, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidInspectionStatusTransitionException extends HttpException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Invalid status transition from ${currentStatus} to ${targetStatus}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InspectorNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Inspector with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class QualityGradeNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Quality grade with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ProduceNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Produce with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class AIAnalysisFailedException extends HttpException {
  constructor(message: string) {
    super(`AI analysis failed: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class InvalidInspectionMethodException extends HttpException {
  constructor(method: string) {
    super(`Invalid inspection method: ${method}`, HttpStatus.BAD_REQUEST);
  }
} 