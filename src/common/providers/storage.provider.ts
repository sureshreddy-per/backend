import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../interfaces/storage.interface';
import { S3Service } from '../services/s3.service';
import { GcpStorageService } from '../services/gcp-storage.service';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export const StorageServiceProvider: Provider = {
  provide: STORAGE_SERVICE,
  useFactory: (configService: ConfigService, s3Service: S3Service, gcpService: GcpStorageService): StorageService => {
    const useGcp = configService.get<boolean>('app.storage.useGcp', true);
    return useGcp ? gcpService : s3Service;
  },
  inject: [ConfigService, S3Service, GcpStorageService],
};