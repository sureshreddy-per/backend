import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  // Parse GCP credentials from base64 JSON
  let gcpCredentials = null;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const credentialsJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, 'base64').toString();
      gcpCredentials = JSON.parse(credentialsJson);
    } catch (error) {
      console.error('Error parsing GCP credentials:', error);
    }
  }

  return {
    env,
    port: parseInt(process.env.PORT, 10) || 3000,
    apiUrl: process.env.API_URL,
    
    // GCP Configuration
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION,
      bucket: process.env.GCP_STORAGE_BUCKET,
      credentials: gcpCredentials,
    },

    // Database
    database: {
      url: process.env.DATABASE_URL,
      synchronize: !isProd, // Only sync in development
      logging: !isProd,    // Only log in development
    },

    // Redis
    redis: {
      url: process.env.REDIS_URL,
    },

    // Cache
    cache: {
      ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
      max: parseInt(process.env.CACHE_MAX_ITEMS, 10) || 100,
    },

    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRY || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    },

    // Storage
    storage: {
      useGcp: process.env.USE_GCP_STORAGE === 'true',
      gcpProjectId: process.env.GCP_PROJECT_ID,
      gcpRegion: process.env.GCP_REGION,
      gcpBucket: process.env.GCP_STORAGE_BUCKET,
      uploadDir: process.env.UPLOAD_DIR || 'uploads',
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 8,
      maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 50,
      maxThumbnailSize: parseInt(process.env.MAX_THUMBNAIL_SIZE_MB, 10) || 2,
      maxReportSize: parseInt(process.env.MAX_REPORT_SIZE_MB, 10) || 10,
      maxDocumentSize: parseInt(process.env.MAX_DOCUMENT_SIZE_MB, 10) || 10,
      allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['jpg', 'jpeg', 'png'],
      allowedVideoTypes: process.env.ALLOWED_VIDEO_TYPES?.split(',') || ['mp4', 'mov'],
      maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST, 10) || 5,
    },

    // OpenAI
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      orgId: process.env.OPENAI_ORG_ID,
      apiEndpoint: process.env.OPENAI_API_ENDPOINT,
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    },

    // Security
    security: {
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 12,
      passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
      passwordRequireNumber: process.env.PASSWORD_REQUIRE_NUMBER === 'true',
      passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
      passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
      loginLockoutDuration: parseInt(process.env.LOGIN_LOCKOUT_DURATION, 10) || 900,
      bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    },

    // Rate Limiting
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },

    // CORS
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      maxAge: parseInt(process.env.CORS_MAX_AGE, 10) || 3600,
    },

    // Feature Flags
    features: {
      enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
      enableEmail: process.env.ENABLE_EMAIL === 'true',
      enableSms: process.env.ENABLE_SMS === 'true',
      enableWeather: process.env.ENABLE_WEATHER === 'true',
      useMockAiService: process.env.USE_MOCK_AI_SERVICE === 'true',
    },

    // System Defaults
    systemDefaults: {
      maxDailyPriceUpdates: parseInt(process.env.MAX_DAILY_PRICE_UPDATES, 10) || 3,
      maxGeospatialRadiusKm: parseInt(process.env.MAX_GEOSPATIAL_RADIUS_KM, 10) || 50,
      baseFeePercentage: parseFloat(process.env.BASE_FEE_PERCENTAGE) || 2,
      minInspectionFee: parseInt(process.env.MIN_INSPECTION_FEE, 10) || 100,
      maxInspectionFee: parseInt(process.env.MAX_INSPECTION_FEE, 10) || 5000,
      inspectionBaseFee: parseInt(process.env.INSPECTION_BASE_FEE, 10) || 500,
      inspectionFeePerKm: parseInt(process.env.INSPECTION_FEE_PER_KM, 10) || 5,
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
      filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    },
  };
});
