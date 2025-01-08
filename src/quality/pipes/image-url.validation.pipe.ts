import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageUrlValidationPipe implements PipeTransform {
  private readonly MAX_IMAGES = 3;
  private readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

  transform(value: string[]): string[] {
    if (!value) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new BadRequestException('Image URLs must be an array');
    }

    if (value.length > this.MAX_IMAGES) {
      throw new BadRequestException(`Maximum ${this.MAX_IMAGES} images allowed`);
    }

    value.forEach(url => {
      if (!this.isValidImageUrl(url)) {
        throw new BadRequestException(`Invalid image URL: ${url}`);
      }
    });

    return value;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase();
      return extension ? this.ALLOWED_EXTENSIONS.includes(extension) : false;
    } catch {
      return false;
    }
  }
} 