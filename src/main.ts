import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { DataSource } from 'typeorm';

async function validateEnvironment(configService: ConfigService) {
  const requiredVars = {
    'DB_HOST': configService.get('app.database.host'),
    'DB_PORT': configService.get('app.database.port'),
    'DB_USER': configService.get('app.database.username'),
    'DB_PASSWORD': configService.get('app.database.password'),
    'DB_NAME': configService.get('app.database.database'),
    'REDIS_HOST': configService.get('app.redis.host'),
    'REDIS_PORT': configService.get('app.redis.port'),
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
      DB_HOST: process.env.DB_HOST,
      REDIS_HOST: process.env.REDIS_HOST,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    });
    
    const app = await NestFactory.create(AppModule);
    console.log('2. NestJS application created');
    
    const configService = app.get(ConfigService);
    const env = configService.get('app.env');
    console.log(`3. Running in ${env} mode`);

    // Validate environment variables
    console.log('4. Validating environment variables...');
    try {
      await validateEnvironment(configService);
      console.log('5. Environment variables validated successfully');
    } catch (error) {
      console.error('Environment validation failed:', error);
      throw error;
    }
    
    // Configure app
    app.setGlobalPrefix('api');
    console.log('6. API prefix set');
    
    // CORS configuration
    const corsConfig = configService.get('app.cors');
    console.log('7. Configuring CORS with origins:', corsConfig.origin);
    try {
      app.enableCors({
        origin: corsConfig.origin || '*',  // Fallback to allow all if not configured
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        maxAge: corsConfig.maxAge || 3600,
      });
      console.log('8. CORS configured successfully');
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
          connectSrc: ["'self'", ...corsConfig.origin], // Add CORS origins to connectSrc
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));
    console.log('9. Security headers configured');

    console.log('10. Getting HTTP adapter and DataSource...');
    const httpAdapter = app.get(HttpAdapterHost);
    const dataSource = app.get(DataSource);
    console.log('11. HTTP adapter and DataSource retrieved');

    console.log('12. Configuring application middleware and settings...');
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    console.log('13. Global exception filter configured');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    console.log('14. Validation pipe configured');

    console.log('28. All service connections verified, starting HTTP server...');

    // Start the server with dual-stack support
    const host = configService.get('app.host') || '::';  // '::' binds to both IPv4 and IPv6
    const port = configService.get('app.port') || 3000;
    const server = await app.listen(port, host, () => {
      console.log(`Server is running on http://[${host}]:${port}`);
    });
    
    // Configure server timeouts
    server.setTimeout(30000); // 30 seconds socket timeout
    server.keepAliveTimeout = 65000; // 65 seconds keep-alive timeout
    server.headersTimeout = 66000; // 66 seconds headers timeout

    const url = await app.getUrl();
    console.log(`Application is running on: ${url}`);
    console.log(`Health endpoint available at: ${url}/api/health`);
    console.log(`Environment: ${env}`);
    console.log('Configuration:', {
      database: {
        url: configService.get('app.database.url') ? 'Set' : 'Missing',
        synchronize: configService.get('app.database.synchronize'),
        logging: configService.get('app.database.logging'),
      },
      redis: {
        url: configService.get('app.redis.url') ? 'Set' : 'Missing',
      },
      cors: {
        origin: configService.get('app.cors.origin'),
      },
      features: configService.get('app.features'),
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM signal. Starting graceful shutdown...');
      try {
        await server.close();
        await dataSource.destroy();
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
