import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  InspectionNotFoundException,
  InspectionAlreadyCompletedException,
  InvalidInspectionStatusTransitionException,
  InspectorNotFoundException,
  QualityGradeNotFoundException,
  ProduceNotFoundException,
  AIAnalysisFailedException,
  InvalidInspectionMethodException,
} from '../exceptions/inspection.exceptions';

@Catch(
  InspectionNotFoundException,
  InspectionAlreadyCompletedException,
  InvalidInspectionStatusTransitionException,
  InspectorNotFoundException,
  QualityGradeNotFoundException,
  ProduceNotFoundException,
  AIAnalysisFailedException,
  InvalidInspectionMethodException,
)
export class InspectionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(InspectionExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.message;

    this.logger.error(`Inspection error: ${message}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      error: exception.name,
    });
  }
} 