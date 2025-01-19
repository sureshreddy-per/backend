import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { DataSource } from 'typeorm';
import { AppDataSource } from "./config/typeorm.config";

async function validateEnvironment(configService: ConfigService) {
  const requiredVars = {
    'DATABASE_URL': configService.get('app.database.url'),
    'REDIS_URL': configService.get('app.redis.url'),
    'JWT_SECRET': configService.get('app.jwt.secret'),
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

async function bootstrap() {
  try {
    console.log('1. Starting application bootstrap...');
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Using constructed URL',
      REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Using constructed URL',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    });

    // Initialize database connection first
    if (!AppDataSource.isInitialized) {
      console.log('2. Initializing database connection...');
      await AppDataSource.initialize();
      console.log('3. Database connection initialized');
    } else {
      console.log('2. Database already initialized');
    }
    
    const app = await NestFactory.create(AppModule);
    console.log('4. NestJS application created');
    
    const configService = app.get(ConfigService);
    const env = configService.get('app.env');
    console.log(`5. Running in ${env} mode`);

    // Validate environment variables
    console.log('6. Validating environment variables...');
    try {
      await validateEnvironment(configService);
      console.log('7. Environment variables validated successfully');
    } catch (error) {
      console.error('Environment validation failed:', error);
      throw error;
    }
    
    // Configure app
    app.setGlobalPrefix('api');
    console.log('8. API prefix set');
    
    // CORS configuration
    const corsConfig = configService.get('app.cors');
    console.log('9. Configuring CORS with origins:', corsConfig.origin);
    try {
      app.enableCors({
        origin: corsConfig.origin || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        maxAge: corsConfig.maxAge || 3600,
      });
      console.log('10. CORS configured successfully');
    } catch (error) {
      console.error('CORS configuration failed:', error);
      throw error;
    }
    
    // Security headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'http:'],
          connectSrc: ["'self'", ...corsConfig.origin],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));
    console.log('11. Security headers configured');

    app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
    console.log('12. Global exception filter configured');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    console.log('13. Validation pipe configured');

    // Start the server with dual-stack support
    const host = configService.get('app.host') || '0.0.0.0';
    const port = configService.get('app.port') || 3000;
    
    console.log('14. Starting HTTP server...');
    const server = await app.listen(port, host);
    console.log(`15. Server is running on http://${host}:${port}`);
    
    // Configure server timeouts
    server.setTimeout(30000);
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    const url = await app.getUrl();
    console.log(`Application is running on: ${url}`);
    console.log(`Health endpoint available at: ${url}/api/health`);
    console.log(`Environment: ${env}`);

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM signal. Starting graceful shutdown...');
      try {
        await server.close();
        await AppDataSource.destroy();
        console.log('Server and database connections closed.');
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();
