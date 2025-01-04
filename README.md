# Backend Service

## Overview

This backend service provides a comprehensive API for an agricultural marketplace platform, connecting farmers with buyers. It includes features for produce listing, quality assessment, automated offer generation, and transaction management.

## Key Features

- **Authentication & Authorization**
  - User registration with role-based access (Farmer/Buyer)
  - JWT-based authentication
  - Account verification and blocking mechanisms
  - Rate limiting (5 failed attempts = 15min lockout)

- **Farmer Management**
  - Profile creation and management
  - Farm details and location tracking
  - Produce listing and management
  - Historical transaction tracking

- **Buyer Management**
  - Profile creation and management
  - Business details verification
  - Daily price setting by quality grade
  - Automated offer generation based on preferences

- **Produce Management**
  - Listing creation with location data
  - Quality grading system
  - Availability status tracking
  - Nearby produce search functionality

- **Offer System**
  - Manual offer creation
  - Automated offer generation based on:
    - Quality grade finalization
    - Daily price updates
  - Offer lifecycle management (accept/reject/cancel)
  - Price history tracking
  - Auto-expiry after 24 hours

- **Transaction Management**
  - Full transaction lifecycle
  - Quantity and price tracking
  - Status updates (pending/completed/cancelled)
  - Metadata management

- **Quality Assessment**
  - Multi-criteria evaluation
  - Grade calculation
  - Price impact tracking
  - Automated offer generation on finalization

- **Inspection Service**
  - Scheduling system
  - Report generation
  - Certification tracking
  - Export quality verification

- **Rating System**
  - User ratings for both farmers and buyers
  - Transaction-based rating system
  - Historical rating tracking
  - Impact on automated offer generation

- **Support System**
  - Ticket creation and management
  - Priority levels
  - Category-based routing
  - Status tracking

- **Admin Functions**
  - User management
  - Support ticket oversight
  - System configuration
  - Block/unblock users

- **Notification System**
  - Real-time event notifications
  - Multiple notification types
  - Read status tracking
  - Event-based triggers

## Edge Cases & Limitations

- **Offer System**
  - Maximum 5 active offers per produce
  - Maximum 3 simultaneous offers per buyer-produce pair
  - 15-minute grace period for price adjustments
  - Price changes trigger automatic notifications
  - Offers expire after 24 hours by default

- **Rate Limiting**
  - Login attempts: 5 tries before 15-minute lockout
  - API calls: Limits vary by endpoint
  - Concurrent requests: Managed per user

- **Data Validation**
  - Price range: 0.01 to 1,000,000
  - Location coordinates must be valid
  - Dates must be in ISO format
  - Required fields strictly enforced

- **Business Rules**
  - Buyers can't modify accepted offers
  - Farmers can't accept expired offers
  - Quality grade required for transaction completion
  - Location required for nearby searches
  - Rating only allowed after transaction completion

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration.

4. Start the development server:
```bash
npm run start:dev
```

## Testing

Run tests:
```bash
npm test
```

Run e2e tests:
```bash
npm run test:e2e
```

## API Documentation

- Swagger documentation available at `/api-docs` when server is running
- Detailed API examples in `docs/api-examples.md`
- Event documentation in `docs/events.md`
- Integration guides in `docs/integration/`

## Error Handling

The API uses standard HTTP status codes and includes detailed error messages:

- 400: Bad Request (Invalid input)
- 401: Unauthorized (Invalid/missing token)
- 403: Forbidden (Insufficient permissions)
- 404: Not Found (Resource doesn't exist)
- 409: Conflict (Resource already exists)
- 429: Too Many Requests (Rate limit exceeded)
- 500: Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[License details here]
