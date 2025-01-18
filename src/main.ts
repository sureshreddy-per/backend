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
    console.log('Starting application bootstrap...');
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const env = configService.get('app.env');
    
    console.log(`Running in ${env} mode`);
    
    // Configure app
    app.setGlobalPrefix('api');
    
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

    const httpAdapter = app.get(HttpAdapterHost);
    const dataSource = app.get(DataSource);

    console.log('Configuring application middleware and settings...');

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    const host = configService.get('app.host') || '0.0.0.0';
    const port = configService.get('app.port') || 3000;

    console.log(`Starting server on ${host}:${port}...`);
    
    // Test database connection before starting the server
    try {
      console.log('Initializing database connection...');
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      
      // Test the connection with a timeout
      const testConnection = async () => {
        try {
          await Promise.race([
            dataSource.query('SELECT 1'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database connection timeout')), 10000)
            )
          ]);
          return true;
        } catch (error) {
          console.error('Database connection test failed:', error);
          return false;
        }
      };

      // Retry connection up to 3 times
      for (let i = 0; i < 3; i++) {
        if (await testConnection()) {
          console.log('Database connection verified successfully');
          break;
        }
        if (i === 2) {
          throw new Error('Failed to establish database connection after 3 attempts');
        }
        console.log(`Retrying database connection (attempt ${i + 2}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }

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
