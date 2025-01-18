import { registerAs } from '@nestjs/config';

export default registerAs('production', () => ({
  // Server Configuration
  port: parseInt(process.env.PORT, 10) || 3000,
  api_url: process.env.API_URL || 'http://api.agrochain.com',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://agrochain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    maxAge: 3600,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
  },

  // Security Headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'http:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    morgan: {
      enabled: true,
      format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    },
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes
    max: parseInt(process.env.CACHE_MAX_ITEMS, 10) || 100,
  },

  // File Upload Limits
  uploads: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 5,
    maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 50,
    maxDocumentSize: parseInt(process.env.MAX_DOCUMENT_SIZE_MB, 10) || 10,
    storage: 'gcp',
  },

  // Performance Optimization
  optimization: {
    compression: true,
    minify: true,
    gzip: true,
  },
})); 