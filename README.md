# Customer-Buyer Application Backend

A NestJS-based backend application for managing customer-buyer relationships in agricultural produce trading.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Customer, Buyer)
  - Secure password hashing

- **Customer Management**
  - Customer registration and profile management
  - Farm location tracking
  - Honesty rating system
  - Contact visibility settings

- **Buyer Management**
  - Buyer registration and profile management
  - Company information
  - Transaction history
  - Rating system

- **Produce Management**
  - Produce listings with details
  - Quality assessment
  - Location tracking
  - Photo and video support

- **Quality Assessment**
  - Customizable quality parameters
  - Quality scoring system
  - Parameter weighting
  - Historical quality data

- **Offer Management**
  - Create and manage offers
  - Price negotiation
  - Offer status tracking
  - Real-time notifications

- **Transaction Management**
  - Secure transaction processing
  - Transaction history
  - Statistics and reporting
  - Value tracking

- **Notification System**
  - Real-time WebSocket notifications
  - Email notifications
  - Notification preferences
  - Redis-based caching

- **Support System**
  - Ticket management
  - Priority levels
  - Response tracking
  - Statistics and reporting

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **Real-time**: WebSocket (Socket.io)
- **Documentation**: Swagger/OpenAPI
- **Authentication**: JWT
- **Testing**: Jest
- **API Documentation**: Swagger UI

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- Redis (v6 or later)
- Docker (optional, for containerization)

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/customer-buyer-app.git
cd customer-buyer-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start the database:
\`\`\`bash
# If using Docker
docker-compose up -d postgres redis
\`\`\`

5. Run migrations:
\`\`\`bash
npm run migration:run
\`\`\`

6. Start the application:
\`\`\`bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
\`\`\`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Application port | 3000 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_NAME | Database name | customer_buyer_app |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| JWT_SECRET | JWT secret key | your_jwt_secret_key_here |
| JWT_EXPIRATION | JWT expiration | 24h |

## API Documentation

The API documentation is available at \`/api/docs\` when running the application. It provides detailed information about all endpoints, request/response schemas, and authentication requirements.

### Main API Endpoints

- **/auth** - Authentication endpoints
- **/customers** - Customer management
- **/buyers** - Buyer management
- **/produce** - Produce listings
- **/quality** - Quality assessment
- **/offers** - Offer management
- **/transactions** - Transaction processing
- **/notifications** - Notification management
- **/support** - Support system

## WebSocket Events

### Notifications Namespace (/notifications)

- **connection** - Client connects with JWT token
- **notification** - Receive real-time notifications
- **readNotification** - Mark notification as read

## Docker Support

The application includes Docker support for easy deployment:

\`\`\`bash
# Build and start all services
docker-compose up -d

# Build and start specific service
docker-compose up -d app

# View logs
docker-compose logs -f app
\`\`\`

## Testing

\`\`\`bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
\`\`\`

## Project Structure

\`\`\`
src/
├── auth/           # Authentication module
├── buyers/         # Buyers module
├── common/         # Shared utilities
├── config/         # Configuration
├── customers/      # Customers module
├── database/       # Database configuration
├── notifications/  # Notifications module
├── offers/         # Offers module
├── produce/        # Produce module
├── quality/        # Quality module
├── redis/          # Redis module
├── support/        # Support module
├── transactions/   # Transactions module
├── app.module.ts   # Main application module
└── main.ts        # Application entry point
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please create an issue in the GitHub repository or contact the development team.
