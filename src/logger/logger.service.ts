import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  log(message: string, context?: string) {
    console.log(`[${context || 'Application'}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || 'Application'}] ${message}`, trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${context || 'Application'}] ${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[${context || 'Application'}] ${message}`);
  }
} 