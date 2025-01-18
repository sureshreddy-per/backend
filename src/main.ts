import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  try {
    console.log('Starting application bootstrap...');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);
    const httpAdapter = app.get(HttpAdapterHost);

    console.log('Configuring application middleware and settings...');

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Configure CORS
    app.enableCors();

    // Basic security headers
    app.use(helmet());

    // Validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.setGlobalPrefix("api");

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = '0.0.0.0';

    console.log(`Starting server on ${host}:${port}...`);
    
    await app.listen(port, host);
    console.log(`Application is running on port ${port}`);
  } catch (error) {
    console.error('Error starting application:', error);
    // Add a delay before exiting to ensure logs are captured
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(1);
  }
}

bootstrap();
