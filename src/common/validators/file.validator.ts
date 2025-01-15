import { BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import * as mime from 'mime-types';

export class FileValidator {
  static validateFile(file: Express.Multer.File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${options.maxSize} bytes`,
      );
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const mimeType = mime.lookup(file.originalname);
      if (!mimeType || !options.allowedTypes.includes(mimeType)) {
        throw new BadRequestException(
          `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
        );
      }
    }

    // Validate file name
    if (!this.isValidFileName(file.originalname)) {
      throw new BadRequestException('Invalid file name');
    }

    return true;
  }

  private static isValidFileName(fileName: string): boolean {
    // Check for common malicious patterns
    const maliciousPatterns = [
      /\.\./,  // Directory traversal
      /^[/\\]/,  // Absolute paths
      /[<>:"|?*]/,  // Invalid characters
      /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i,  // Reserved names in Windows
    ];

    return !maliciousPatterns.some(pattern => pattern.test(fileName));
  }
}