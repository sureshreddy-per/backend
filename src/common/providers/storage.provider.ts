import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../interfaces/storage.interface';
import { S3Service } from '../services/s3.service';
import { GcpStorageService } from '../services/gcp-storage.service';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export const StorageServiceProvider: Provider = {
  provide: STORAGE_SERVICE,
  useFactory: (configService: ConfigService, s3Service: S3Service, gcpService: GcpStorageService): StorageService => {
    const provider = (configService.get<string>('storageProvider') || 'gcp').toLowerCase();

    switch (provider) {
      case 's3':
        return s3Service;
      case 'gcp':
        return gcpService;
      default:
        throw new Error(`Invalid storage provider: ${provider}. Valid options are 'gcp' or 's3'.`);
    }
  },
  inject: [ConfigService, S3Service, GcpStorageService],
};