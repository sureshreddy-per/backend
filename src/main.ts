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
    const app = await NestFactory.create(AppModule);
    console.log('2. NestJS application created');
    
    const configService = app.get(ConfigService);
    const env = configService.get('app.env');
    console.log(`3. Running in ${env} mode`);

    // Validate environment variables
    console.log('4. Validating environment variables...');
    await validateEnvironment(configService);
    console.log('5. Environment variables validated');
    
    // Configure app
    app.setGlobalPrefix('api');
    console.log('6. API prefix set');
    
    // CORS configuration
    const corsConfig = configService.get('app.cors');
    console.log('7. Configuring CORS with origins:', corsConfig.origin);
    app.enableCors({
      origin: corsConfig.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
      maxAge: corsConfig.maxAge,
    });
    console.log('8. CORS configured');
    
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

    const host = configService.get('app.host') || '0.0.0.0';
    const port = configService.get('app.port') || 3000;
    console.log(`15. Host and port configured: ${host}:${port}`);
    
    // Test database connection before starting the server
    try {
      console.log('16. Starting database initialization...');
      
      // Initialize database with timeout
      if (!dataSource.isInitialized) {
        console.log('17. DataSource not initialized, initializing now...');
        await Promise.race([
          dataSource.initialize(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database initialization timeout after 30 seconds')), 30000)
          )
        ]);
        console.log('18. DataSource initialization completed');
      } else {
        console.log('17. DataSource already initialized');
      }
      
      console.log('19. Testing database connection...');
      // Test the connection with a timeout
      const testConnection = async () => {
        try {
          await Promise.race([
            dataSource.query('SELECT 1'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database connection test timeout after 10 seconds')), 10000)
            )
          ]);
          return true;
        } catch (error) {
          console.error('Database connection test failed:', error);
          return false;
        }
      };

      // Retry connection up to 3 times with exponential backoff
      for (let i = 0; i < 3; i++) {
        console.log(`20. Database connection attempt ${i + 1}/3`);
        if (await testConnection()) {
          console.log('21. Database connection verified successfully');
          break;
        }
        if (i === 2) {
          throw new Error('Failed to establish database connection after 3 attempts');
        }
        const backoffTime = Math.min(1000 * Math.pow(2, i), 5000); // Exponential backoff with max 5 seconds
        console.log(`Retrying database connection in ${backoffTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }

      // Test Redis connection with proper error handling
      console.log('22. Starting Redis connection test...');
      try {
        const cacheManager = app.get('CACHE_MANAGER');
        console.log('23. Cache manager retrieved');
        
        try {
          console.log('24. Testing Redis connection with timeout...');
          await Promise.race([
            cacheManager.set('test-key', 'test-value'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis connection timeout after 10 seconds')), 10000)
            )
          ]);
          console.log('25. Redis connection verified successfully');
          
          // Clean up test key
          await cacheManager.del('test-key');
        } catch (error) {
          console.error('26. Warning: Redis connection failed:', error);
          console.log('27. Continuing startup despite Redis connection failure...');
        }
      } catch (error) {
        console.error('Error getting cache manager:', error);
        console.log('Continuing startup without Redis...');
      }

    } catch (error) {
      console.error('Fatal error during initialization:', error);
      throw error;
    }

    console.log('28. All service connections verified, starting HTTP server...');

    // Start the server with a graceful shutdown handler and increased timeouts
    const server = await app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
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
