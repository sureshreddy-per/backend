import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

async function bootstrap() {
  try {
    console.log('Starting application bootstrap...');

    // SSL configuration for production
    let httpsOptions = undefined;
    if (process.env.NODE_ENV === 'production') {
      try {
        httpsOptions = {
          key: fs.readFileSync(path.join(process.cwd(), 'ssl/privkey.pem')),
          cert: fs.readFileSync(path.join(process.cwd(), 'ssl/fullchain.pem')),
          ca: fs.readFileSync(path.join(process.cwd(), 'ssl/chain.pem')),
        };
      } catch (error) {
        console.warn('SSL certificates not found, running without HTTPS');
      }
    }

    console.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
      httpsOptions,
    });

    const configService = app.get(ConfigService);
    const httpAdapter = app.get(HttpAdapterHost);
    const dataSource = app.get(DataSource);

    console.log('Configuring application middleware and settings...');

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Configure CORS based on environment
    app.enableCors({
      origin: process.env.NODE_ENV === 'production'
        ? configService.get('ALLOWED_ORIGINS')?.split(',') || ['https://farmdeva.com']
        : true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
      maxAge: 3600,
    });

    // Enhanced security headers with relaxed CSP for development
    app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      } : false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }));

    // Validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.setGlobalPrefix("api");

    // Force HTTPS redirect in production
    if (process.env.NODE_ENV === 'production') {
      app.use((req, res, next) => {
        if (req.secure) {
          next();
        } else {
          res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
      });
    }

    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3000', 10);

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

    // Start the server with a graceful shutdown handler
    const server = await app.listen(port, host);
    const url = await app.getUrl();
    console.log(`Application is running on: ${url}`);
    console.log(`Health endpoint available at: ${url}/api/health`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`SSL is ${httpsOptions ? 'enabled' : 'disabled'}`);
    }

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
