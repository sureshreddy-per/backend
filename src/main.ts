import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { DataSource } from 'typeorm';

async function bootstrap() {
  try {
    console.log('1. Starting application bootstrap...');
    const app = await NestFactory.create(AppModule);
    console.log('2. NestJS application created');
    
    const configService = app.get(ConfigService);
    const env = configService.get('app.env');
    console.log(`3. Running in ${env} mode`);
    
    // Configure app
    app.setGlobalPrefix('api');
    console.log('4. API prefix set');
    
    // CORS configuration
    const corsConfig = configService.get('app.cors');
    app.enableCors({
      origin: corsConfig.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
      maxAge: corsConfig.maxAge,
    });
    console.log('5. CORS configured');
    
    // Security headers
    app.use(helmet({
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
    }));
    console.log('6. Security headers configured');

    console.log('7. Getting HTTP adapter and DataSource...');
    const httpAdapter = app.get(HttpAdapterHost);
    const dataSource = app.get(DataSource);
    console.log('8. HTTP adapter and DataSource retrieved');

    console.log('9. Configuring application middleware and settings...');
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    console.log('10. Global exception filter configured');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    console.log('11. Validation pipe configured');

    const host = configService.get('app.host') || '0.0.0.0';
    const port = configService.get('app.port') || 3000;
    console.log(`12. Host and port configured: ${host}:${port}`);
    
    // Test database connection before starting the server
    try {
      console.log('13. Starting database initialization...');
      
      // Initialize database with timeout
      if (!dataSource.isInitialized) {
        console.log('14. DataSource not initialized, initializing now...');
        await Promise.race([
          dataSource.initialize(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database initialization timeout after 30 seconds')), 30000)
          )
        ]);
        console.log('15. DataSource initialization completed');
      } else {
        console.log('14. DataSource already initialized');
      }
      
      console.log('16. Testing database connection...');
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
        console.log(`17. Database connection attempt ${i + 1}/3`);
        if (await testConnection()) {
          console.log('18. Database connection verified successfully');
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
      console.log('19. Starting Redis connection test...');
      try {
        const cacheManager = app.get('CACHE_MANAGER');
        console.log('20. Cache manager retrieved');
        
        try {
          console.log('21. Testing Redis connection with timeout...');
          await Promise.race([
            cacheManager.set('test-key', 'test-value'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis connection timeout after 10 seconds')), 10000)
            )
          ]);
          console.log('22. Redis connection verified successfully');
          
          // Clean up test key
          await cacheManager.del('test-key');
        } catch (error) {
          console.error('23. Warning: Redis connection failed:', error);
          console.log('24. Continuing startup despite Redis connection failure...');
        }
      } catch (error) {
        console.error('Error getting cache manager:', error);
        console.log('Continuing startup without Redis...');
      }

    } catch (error) {
      console.error('Fatal error during initialization:', error);
      throw error;
    }

    console.log('25. All service connections verified, starting HTTP server...');

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
