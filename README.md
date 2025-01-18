# AgriTrade Backend

A **backend** system for an agricultural marketplace enabling farmers to list produce with AI-driven quality assessments, and buyers to receive automated offers based on their daily min/max price ranges. The platform also supports manual inspections, transaction tracking, multi-language names/synonyms, and more.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This backend implements:

1. **User Authentication** (mobile-based OTP, JWT tokens, RBAC).
2. **Produce Management** (photo/video uploads, AI classification, location-based logic).
3. **Offers Service** (automatic creation & recalculation of offers, 24h delivery window).
4. **Inspection Flow** (AI-based or manual, fees & distance-based calculations).
5. **Transactions** (offer completion, ratings & feedback).
6. **Multi-Language & Synonym Support** for produce names.
7. **Strict Category-Specific Quality Parameters** (Food Grains, Oilseeds, Fruits, etc.).

---

## Architecture

This project can be organized as **microservices** or as a **modular monolith** with clearly separated modules:

```
┌─────────────────────┐         ┌─────────────────────┐
│      Auth Service   │         │   Inspection Service │
│ (OTP, JWT, RBAC)    │         │ (Manual overrides)   │
└─────────────────────┘         └──────────────────────┘
         │                                │
         └─── communicates via REST ──────┘

┌─────────────────────┐         ┌──────────────────────┐
│   Produce Service   │         │       Offers Svc      │
│ (AI calls, media)   │         │ (auto-generate offers)│
└─────────────────────┘         └───────────────────────┘
         │                                │
         └─── (shared DB or messages) ────┘

┌────────────────────────────────────────────────────────┐
│           PostgreSQL (with PostGIS) & S3              │
│  (storing produce, offers, transactions, synonyms...) │
└────────────────────────────────────────────────────────┘
```

Key points:

- **Auth Service** handles OTP verification, JWT token issuance, role-based permissions.
- **Produce Service** manages produce listings, calls the **AI Vision** API, and stores quality data in the DB.
- **Offers Service** handles generation and lifecycle of offers, factoring in buyer daily min/max prices and location.
- **Inspection** (manual) can be its own module or service.
- **Transactions** record final completions, enabling ratings and feedback.

---

## Tech Stack

- **Language/Framework**: Node.js (Express) / Java / Python / (your choice)
- **Database**: PostgreSQL (recommended with PostGIS for geospatial queries)
- **Object Storage**: AWS S3 / GCP Cloud Storage (for media files)
- **API Docs**: Swagger / OpenAPI (recommended)
- **Authentication**: JWT, Mobile OTP
- **Others**: Message queue (optional for scale), etc.

---

## Project Structure

A typical Node.js project might look like this:

```
├── src
│   ├── auth
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── ...
│   ├── produce
│   │   ├── produce.controller.js
│   │   ├── produce.service.js
│   │   └── qualityAssessment.js
│   ├── offers
│   │   ├── offers.controller.js
│   │   ├── offers.service.js
│   ├── inspection
│   │   ├── inspection.controller.js
│   │   └── inspection.service.js
│   ├── transactions
│   │   ├── transactions.controller.js
│   │   └── transactions.service.js
│   ├── models
│   │   └── (Sequelize or TypeORM entities, etc.)
│   ├── db
│   │   └── migrations
│   ├── utils
│   │   └── (helpers, config loaders, logger, etc.)
│   ├── index.js            # App entrypoint
│   └── ...
├── config
│   └── default.json        # or .env, config files
├── .env.example
├── package.json
├── README.md
└── ...
```

*(Adjust based on your language/framework of choice.)*

---

## Environment Variables

Typical environment variables might include:

| **Variable**           | **Description**                                 | **Example**                |
|------------------------|------------------------------------------------|----------------------------|
| `PORT`                 | Port on which server listens                   | `3000`                     |
| `DB_HOST`              | Database host                                  | `127.0.0.1`               |
| `DB_PORT`              | Database port                                  | `5432`                     |
| `DB_USER`              | Database username                              | `postgres`                 |
| `DB_PASSWORD`          | Database password                              | `secret`                   |
| `DB_NAME`              | Database name                                  | `agritrade`                |
| `JWT_SECRET`           | Secret key for JWT signing                     | `some-random-string`       |
| `AI_API_KEY`           | API key/secret for AI Vision service           | `abc123xyz`                |
| `S3_BUCKET_NAME`       | S3 bucket name for media                       | `my-bucket`                |
| `S3_ACCESS_KEY_ID`     | AWS/GCP Access Key ID                          | `AKIAXXX...`               |
| `S3_SECRET_ACCESS_KEY` | AWS/GCP Secret Access Key                      | `XXXXXXXX`                 |
| `OTP_EXPIRATION_MIN`   | Minutes until OTP expires                      | `5`                        |

Create or copy a **`.env`** file (or **config/default.json**) from **`.env.example`** and fill in your credentials.

---

## Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/agritrade-backend.git
   cd agritrade-backend
   ```

2. **Install Dependencies**
   - If Node.js:
     ```bash
     npm install
     ```
   - If Python/Poetry, or Java/Maven, adapt accordingly.

3. **Configure Environment**
   - Copy `.env.example` to `.env` (or set environment variables in your system).
   - Update DB credentials, AI API keys, etc.

4. **Database Setup**
   - Ensure you have a running PostgreSQL instance (optionally with PostGIS).
   - Create the database manually or via scripts (e.g., `createdb agritrade`).

---

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

---

## Database Migrations

If using an ORM (e.g., Sequelize, TypeORM) or a migrations library:

1. **Generate new migration** when changing DB schemas:
   ```bash
   npm run migration:generate --name add_quality_fields
   ```
2. **Apply migrations**:
   ```bash
   npm run migration:up
   ```
3. **Revert** if needed:
   ```bash
   npm run migration:down
   ```

*(Commands may vary depending on your tooling.)*

---

## Testing

1. **Unit Tests**
   ```bash
   npm run test
   ```
   Ensures each service and controller behaves as expected.

2. **Integration Tests**
   - Typically involve spinning up a test DB or using a mocking strategy for external services (AI, etc.).
   ```bash
   npm run test:integration
   ```

3. **Coverage**
   - Generate code coverage reports:
   ```bash
   npm run coverage
   ```

*(Adapt commands to your language/framework test runner.)*

---

## API Documentation

- Access **Swagger/OpenAPI** docs (if configured) at:
  ```
  GET /api-docs
  ```
  or something similar.

- You can also find **Postman** collections or an **OpenAPI** spec file in `/docs` or in the repository root, depending on how you maintain docs.

---

## Contributing

1. **Fork** the repository and create your feature branch from `main`.
2. **Pull requests** should pass all linting/tests and receive at least one approval.
3. **Write tests** for any new or changed functionality.
4. Adhere to existing **coding standards** and naming conventions.

---

## License

*(Choose a license e.g. MIT, Apache 2.0, etc.)*
```
MIT License (Example)

Copyright (c) 2023 ...

Permission is hereby granted...
```

---

**Happy Coding!** If you have any questions or issues, please open an **issue** or contact the project maintainers.

## Environment Setup

Make sure to set these variables in your `.env.production`:

```env
# Application
NODE_ENV=production
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://farmdeva.com,http://api.farmdeva.com
CORS_MAX_AGE=3600

# Admin Configuration
ADMIN_USERS=admin@farmdeva.com
```

## Security Features

The application implements several security features:
- Rate limiting
- CORS protection
- XSS protection
- Content Security Policy

## Production Deployment

1. Set up environment variables:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production values
   ```

2. Install dependencies:
   ```bash
   npm install --production
   ```

3. Start the application:
   ```bash
   npm run start:prod
   ```

The application will start with all security features active.