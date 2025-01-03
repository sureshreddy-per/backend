import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Customer-Buyer Application API')
    .setDescription(`
      API documentation for the Customer-Buyer Application.
      
      This application provides a platform for agricultural produce trading between customers (farmers) and buyers.
      
      ## Features
      
      - Authentication & Authorization
      - Customer & Buyer Management
      - Produce Listings
      - Quality Assessment
      - Offer Management
      - Transaction Processing
      - Real-time Notifications
      - Support System
      
      ## Authentication
      
      Most endpoints require authentication using JWT tokens. To authenticate:
      
      1. Register using /auth/register
      2. Login using /auth/login to get a JWT token
      3. Include the token in the Authorization header:
         \`Authorization: Bearer your_jwt_token\`
      
      ## Role-Based Access
      
      The API uses role-based access control with three main roles:
      - Admin: Full access to all endpoints
      - Customer: Access to customer-specific endpoints
      - Buyer: Access to buyer-specific endpoints
      
      ## WebSocket Support
      
      Real-time notifications are handled through WebSocket connections.
      Connect to the notifications namespace with your JWT token for authentication.
      
      ## Rate Limiting
      
      API endpoints are rate-limited to prevent abuse. See response headers for limit details.
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Customers', 'Customer management endpoints')
    .addTag('Buyers', 'Buyer management endpoints')
    .addTag('Produce', 'Produce listing endpoints')
    .addTag('Quality', 'Quality assessment endpoints')
    .addTag('Offers', 'Offer management endpoints')
    .addTag('Transactions', 'Transaction processing endpoints')
    .addTag('Notifications', 'Notification management endpoints')
    .addTag('Support', 'Support system endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Customer-Buyer API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui-themes/3.0.0/themes/3.x/theme-material.css',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui-themes/3.0.0/themes/3.x/theme-material.css',
    ],
  });
} 