export interface StorageOptions {
  bucket?: string;
  path?: string;
  contentType?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface StorageResponse {
  url: string;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
  metadata?: Record<string, string>;
}

export interface StorageService {
  uploadFile(
    file: Buffer | string,
    filename: string,
    options?: StorageOptions
  ): Promise<StorageResponse>;

  deleteFile(key: string, bucket?: string): Promise<void>;

  getSignedUrl(key: string, expiresIn?: number, bucket?: string): Promise<string>;

  getPublicUrl(key: string, bucket?: string): string;

  downloadFile(url: string): Promise<{ buffer: Buffer; mimeType: string }>;
}