import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // SSL configuration for production
  const httpsOptions = process.env.NODE_ENV === 'production' ? {
    key: fs.readFileSync(path.join(process.cwd(), 'ssl/privkey.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'ssl/fullchain.pem')),
    ca: fs.readFileSync(path.join(process.cwd(), 'ssl/chain.pem')),
  } : undefined;

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'log', 'debug'],
    httpsOptions,
  });

  const configService = app.get(ConfigService);
  const httpAdapter = app.get(HttpAdapterHost);

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

  // Enhanced security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`SSL is ${httpsOptions ? 'enabled' : 'disabled'}`);
  }
}

bootstrap();
