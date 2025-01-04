# API Documentation with Examples

## Table of Contents
1. [Auth Service](#auth-service)
2. [Farmers Service](#farmers-service)
3. [Buyers Service](#buyers-service)
4. [Produce Service](#produce-service)
5. [Offers Service](#offers-service)
6. [Transactions Service](#transactions-service)
7. [Quality Service](#quality-service)
8. [Inspection Service](#inspection-service)
9. [Ratings Service](#ratings-service)
10. [Support Service](#support-service)
11. [Admin Service](#admin-service)
12. [Notifications Service](#notifications-service)

## Auth Service

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "StrongP@ss123",
  "name": "John Doe",
  "phone": "+1234567890",
  "isFarmer": true,
  "isBuyer": false
}

Response (201 Created):
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isFarmer": true,
    "isBuyer": false,
    "verificationStatus": "PENDING",
    "isBlocked": false,
    "createdAt": "2024-01-20T12:00:00Z",
    "updatedAt": "2024-01-20T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "StrongP@ss123"
}

Response (200 OK):
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isFarmer": true,
    "isBuyer": false,
    "verificationStatus": "VERIFIED",
    "isBlocked": false,
    "lastLoginAt": "2024-01-20T12:30:00Z",
    "createdAt": "2024-01-20T12:00:00Z",
    "updatedAt": "2024-01-20T12:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Validate User
```http
GET /auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "isFarmer": true,
  "isBuyer": false,
  "verificationStatus": "VERIFIED",
  "isBlocked": false,
  "lastLoginAt": "2024-01-20T12:30:00Z",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Block User
```http
POST /auth/block/:userId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reason": "Violation of terms of service"
}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "isBlocked": true,
  "blockReason": "Violation of terms of service",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Unblock User
```http
POST /auth/unblock/:userId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "isBlocked": false,
  "blockReason": null,
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

> **Note**: The password must be at least 8 characters long and contain uppercase, lowercase, number and special character. After 5 failed login attempts, the account will be temporarily locked for 15 minutes.

## Farmers Service

### Create Farmer Profile
```http
POST /farmers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "farmDetails": {
    "size": "50 acres",
    "crops": ["tomatoes", "potatoes", "onions"]
  }
}

Response (201 Created):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phone": "+1234567890",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "farmDetails": {
    "size": "50 acres",
    "crops": ["tomatoes", "potatoes", "onions"]
  },
  "rating": 0,
  "totalRatings": 0,
  "isActive": true,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Farmers
```http
GET /farmers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "rating": 4.5,
      "produceCount": 5,
      "produce": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "type": "TOMATOES",
          "status": "AVAILABLE"
        }
      ]
    }
  ]
}
```

### Get Farmer Profile
```http
GET /farmers/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phone": "+1234567890",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "farmDetails": {
    "size": "50 acres",
    "crops": ["tomatoes", "potatoes", "onions"]
  },
  "rating": 4.5,
  "totalRatings": 10,
  "isActive": true,
  "produceCount": 5,
  "produce": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "type": "TOMATOES",
      "status": "AVAILABLE"
    }
  ],
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Update Farmer Profile
```http
PATCH /farmers/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "phone": "+1234567891",
  "farmDetails": {
    "size": "60 acres",
    "crops": ["tomatoes", "potatoes", "onions", "carrots"]
  }
}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "+1234567891",
  "farmDetails": {
    "size": "60 acres",
    "crops": ["tomatoes", "potatoes", "onions", "carrots"]
  },
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get Farmer's Produce History
```http
GET /farmers/:id/produce-history?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "transactions": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "quantity": 500,
      "pricePerUnit": 25.50,
      "status": "COMPLETED",
      "createdAt": "2024-01-15T12:00:00Z",
      "buyer": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "rating": 4.8
      }
    }
  ],
  "meta": {
    "total": 1,
    "totalValue": 12750,
    "averagePrice": 25.50
  }
}
```

## Buyers Service

### Create Buyer Profile
```http
POST /buyers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "+1234567891",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "businessDetails": {
    "type": "Wholesale",
    "license": "LIC123456"
  }
}

Response (201 Created):
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Jane Smith",
  "phone": "+1234567891",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "businessDetails": {
    "type": "Wholesale",
    "license": "LIC123456"
  },
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get All Buyers
```http
GET /buyers?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Smith",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "rating": 4.8
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "hasNext": true
  }
}
```

### Find Nearby Buyers
```http
GET /buyers/nearby?lat=12.9716&lng=77.5946&radius=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Smith",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "distance": 2.5,
      "rating": 4.8
    }
  ],
  "meta": {
    "total": 5,
    "radius": 10
  }
}
```

### Set Daily Price for Quality Grade
```http
POST /buyers/:buyerId/prices
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "qualityGrade": "A",
  "pricePerUnit": 25.50,
  "effectiveDate": "2024-02-01"
}

Response (201 Created):
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "qualityGrade": "A",
  "pricePerUnit": 25.50,
  "effectiveDate": "2024-02-01",
  "isActive": true,
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Buyer's Active Prices
```http
GET /buyers/:buyerId/prices
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "qualityGrade": "A",
      "pricePerUnit": 25.50,
      "effectiveDate": "2024-02-01",
      "isActive": true,
      "createdAt": "2024-01-20T12:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "qualityGrade": "B",
      "pricePerUnit": 20.00,
      "effectiveDate": "2024-02-01",
      "isActive": true,
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### Get Current Price for Specific Grade
```http
GET /buyers/:buyerId/prices/:grade?date=2024-02-01
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "qualityGrade": "A",
  "pricePerUnit": 25.50,
  "effectiveDate": "2024-02-01",
  "isActive": true,
  "createdAt": "2024-01-20T12:00:00Z"
}
```

## Produce Service

### Create Produce Listing
```http
POST /produce
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "farmerId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "TOMATOES",
  "quantity": 500,
  "price": 25.50,
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "harvestDate": "2024-01-15",
  "description": "Fresh, ripe tomatoes harvested from organic farm"
}

Response (201 Created):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "farmerId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "TOMATOES",
  "quantity": 500,
  "price": 25.50,
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "harvestDate": "2024-01-15",
  "description": "Fresh, ripe tomatoes harvested from organic farm",
  "status": "PENDING",
  "qualityGrade": "PENDING",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Produce
```http
GET /produce?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "type": "TOMATOES",
      "quantity": 500,
      "price": 25.50,
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "harvestDate": "2024-01-15",
      "description": "Fresh, ripe tomatoes harvested from organic farm",
      "status": "AVAILABLE",
      "qualityGrade": "A",
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "rating": 4.5
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:30:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "hasNext": true
  }
}
```

### Get Produce Details
```http
GET /produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "type": "TOMATOES",
  "quantity": 500,
  "price": 25.50,
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "harvestDate": "2024-01-15",
  "description": "Fresh, ripe tomatoes harvested from organic farm",
  "status": "AVAILABLE",
  "qualityGrade": "A",
  "farmer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "rating": 4.5,
    "phone": "+1234567890"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Update Produce
```http
PATCH /produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "price": 27.50,
  "quantity": 450,
  "description": "Updated description for fresh tomatoes"
}

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "price": 27.50,
  "quantity": 450,
  "description": "Updated description for fresh tomatoes",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Delete Produce
```http
DELETE /produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (204 No Content)
```

### Find Nearby Produce
```http
GET /produce/nearby?lat=12.9716&lng=77.5946&radius=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "type": "TOMATOES",
      "quantity": 500,
      "price": 25.50,
      "location": {
        "lat": 12.9720,
        "lng": 77.5950
      },
      "status": "AVAILABLE",
      "qualityGrade": "A",
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "rating": 4.5
      },
      "distance": 0.5
    }
  ]
}
```

## Offers Service

### Create Offer
```http
POST /offers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "quotedPrice": 23.50,
  "quantity": 500,
  "qualityGrade": "A",
  "message": "Interested in buying half the quantity"
}

Response (201 Created):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "pricePerUnit": 23.50,
  "quantity": 500,
  "status": "PENDING",
  "metadata": {
    "qualityGrade": "A",
    "autoGeneratedAt": null,
    "priceHistory": [],
    "lastPriceUpdate": null
  },
  "message": "Interested in buying half the quantity",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Auto-Generated Offers

The system automatically generates offers in two scenarios:

1. When a produce's quality grade is finalized
2. When a buyer sets new daily prices

#### Quality Grade Finalization Event

When a produce's quality grade is finalized, the system automatically generates offers for nearby buyers who have matching daily prices for that quality grade.

```http
Event: quality.grade.finalized
Payload:
{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "grade": "A"
}

Result: System automatically creates offers for matching buyers within 100km radius
```

#### Buyer Price Creation Event

When a buyer sets new daily prices, the system automatically generates offers for matching produce within their specified radius.

```http
Event: buyer.price.created
Payload:
{
  "buyerId": "660e8400-e29b-41d4-a716-446655440000",
  "price": {
    "qualityGrade": "A",
    "pricePerUnit": 25.50,
    "effectiveDate": "2024-02-01"
  }
}

Result: System automatically creates offers for matching produce within 100km radius
```

#### Auto-Generated Offer Rules

The system follows these rules for auto-generated offers:

- Maximum of 5 active offers per produce
- Offers expire after 24 hours by default
- 15-minute grace period for price adjustments
- Maximum of 3 simultaneous offers per buyer-produce pair
- Prioritization based on: buyer rating, distance, and historical transactions

#### Override Auto-Generated Offer

```http
PUT /offers/:id/override
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "pricePerUnit": 24.50,
  "quantity": 450,
  "message": "Adjusting offer based on market conditions"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "pricePerUnit": 24.50,
  "quantity": 450,
  "metadata": {
    "qualityGrade": "A",
    "autoGeneratedAt": "2024-01-20T12:00:00Z",
    "priceHistory": [
      {
        "oldPrice": 23.50,
        "newPrice": 24.50,
        "timestamp": "2024-01-20T12:30:00Z",
        "reason": "Manual override"
      }
    ],
    "lastPriceUpdate": {
      "oldPrice": 23.50,
      "newPrice": 24.50,
      "timestamp": "2024-01-20T12:30:00Z",
      "reason": "Manual override"
    }
  },
  "message": "Adjusting offer based on market conditions",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Update Offer Price
```http
PUT /offers/:id/price
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "newPrice": 24.50,
  "overrideReason": "Market price adjustment"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "pricePerUnit": 24.50,
  "metadata": {
    "priceHistory": [
      {
        "oldPrice": 23.50,
        "newPrice": 24.50,
        "timestamp": "2024-01-20T12:30:00Z",
        "reason": "Market price adjustment"
      }
    ],
    "lastPriceUpdate": {
      "oldPrice": 23.50,
      "newPrice": 24.50,
      "timestamp": "2024-01-20T12:30:00Z",
      "reason": "Market price adjustment"
    }
  },
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Accept Offer
```http
POST /offers/:id/accept
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "farmerId": "550e8400-e29b-41d4-a716-446655440000"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "status": "ACCEPTED",
  "acceptedAt": "2024-01-20T12:30:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Reject Offer
```http
POST /offers/:id/reject
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "farmerId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "Price too low"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "status": "REJECTED",
  "rejectedAt": "2024-01-20T12:30:00Z",
  "rejectionReason": "Price too low",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Cancel Offer
```http
POST /offers/:id/cancel
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "buyerId": "660e8400-e29b-41d4-a716-446655440000",
  "reason": "Found better price elsewhere"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-20T12:30:00Z",
  "cancellationReason": "Found better price elsewhere",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get Buyer's Offers
```http
GET /offers/buyer/:buyerId?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "produceId": "770e8400-e29b-41d4-a716-446655440000",
      "pricePerUnit": 23.50,
      "quantity": 500,
      "status": "PENDING",
      "produce": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "type": "TOMATOES",
        "farmer": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        }
      },
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Transactions Service

### Create Transaction
```http
POST /transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "notes": "Urgent delivery needed"
}

Response (201 Created):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "buyerId": "660e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "status": "PENDING",
  "metadata": {
    "priceAtTransaction": 25.50,
    "qualityGrade": "A",
    "notes": "Urgent delivery needed"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z",
  "produce": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "type": "TOMATOES",
    "quantity": 500,
    "price": 25.50,
    "farmer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    }
  }
}
```

### Get All Transactions
```http
GET /transactions?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "quantity": 100,
      "status": "PENDING",
      "metadata": {
        "priceAtTransaction": 25.50,
        "qualityGrade": "A",
        "notes": "Urgent delivery needed"
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "produce": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "type": "TOMATOES",
        "farmer": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        }
      }
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Get Transaction Details
```http
GET /transactions/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "buyerId": "660e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "status": "PENDING",
  "metadata": {
    "priceAtTransaction": 25.50,
    "qualityGrade": "A",
    "notes": "Urgent delivery needed"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z",
  "buyer": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Smith"
  },
  "produce": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "type": "TOMATOES",
    "quantity": 500,
    "price": 25.50,
    "farmer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    }
  }
}
```

### Update Transaction
```http
PATCH /transactions/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "quantity": 150,
  "notes": "Updated delivery instructions"
}

Response (200 OK):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "quantity": 150,
  "metadata": {
    "priceAtTransaction": 25.50,
    "qualityGrade": "A",
    "notes": "Updated delivery instructions"
  },
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Cancel Transaction
```http
POST /transactions/:id/cancel
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reason": "Changed delivery requirements"
}

Response (200 OK):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "status": "CANCELLED",
  "cancellationReason": "Changed delivery requirements",
  "cancelledAt": "2024-01-20T12:30:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Complete Transaction
```http
POST /transactions/:id/complete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "completedAt": "2024-01-20T12:30:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get Buyer's Transactions
```http
GET /transactions/buyer/:buyerId?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "quantity": 100,
      "status": "PENDING",
      "metadata": {
        "priceAtTransaction": 25.50,
        "qualityGrade": "A",
        "notes": "Urgent delivery needed"
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "produce": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "type": "TOMATOES",
        "farmer": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        }
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Quality Service

### Create Quality Assessment
```http
POST /quality
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "criteria": {
    "appearance": 2,
    "size": 1,
    "freshness": 2,
    "damage": 1
  },
  "notes": "Good quality produce with minor blemishes"
}

Response (201 Created):
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "criteria": {
    "appearance": 2,
    "size": 1,
    "freshness": 2,
    "damage": 1
  },
  "grade": "A",
  "notes": "Good quality produce with minor blemishes",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Quality Assessments
```http
GET /quality
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "criteria": {
        "appearance": 2,
        "size": 1,
        "freshness": 2,
        "damage": 1
      },
      "grade": "A",
      "notes": "Good quality produce with minor blemishes",
      "createdAt": "2024-01-20T12:00:00Z",
      "produce": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "type": "TOMATOES",
        "farmer": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        }
      }
    }
  ],
  "meta": {
    "total": 1
  }
}
```

### Get Quality Assessment Details
```http
GET /quality/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "criteria": {
    "appearance": 2,
    "size": 1,
    "freshness": 2,
    "damage": 1
  },
  "grade": "A",
  "notes": "Good quality produce with minor blemishes",
  "metadata": {
    "finalPrice": 25.50,
    "priceMultiplier": 1.0,
    "finalizedAt": "2024-01-20T12:30:00Z"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:30:00Z",
  "produce": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "type": "TOMATOES",
    "farmer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    }
  }
}
```

### Finalize Quality Assessment
```http
POST /quality/:id/finalize
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "finalPrice": 25.50
}

Response (200 OK):
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "grade": "A",
  "metadata": {
    "finalPrice": 25.50,
    "priceMultiplier": 1.0,
    "finalizedAt": "2024-01-20T12:30:00Z"
  },
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

## Inspection Service

### Schedule Inspection
```http
POST /inspections
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "preferredDate": "2024-01-25",
  "preferredTime": "10:00",
  "notes": "Please inspect for export quality certification"
}

Response (201 Created):
{
  "id": "cc0e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "scheduledDate": "2024-01-25",
  "scheduledTime": "10:00",
  "status": "SCHEDULED",
  "notes": "Please inspect for export quality certification",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Inspection Details
```http
GET /inspections/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "cc0e8400-e29b-41d4-a716-446655440000",
  "produce": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "type": "TOMATOES",
    "farmer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    }
  },
  "inspector": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "name": "Inspector 1"
  },
  "scheduledDate": "2024-01-25",
  "scheduledTime": "10:00",
  "status": "COMPLETED",
  "report": {
    "findings": "Meets export quality standards",
    "recommendations": "Ready for export",
    "certificationIssued": true
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "completedAt": "2024-01-25T10:30:00Z"
}
```

## Ratings Service

### Create Rating
```http
POST /ratings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "offerId": "880e8400-e29b-41d4-a716-446655440000",
  "rating": 4.5,
  "comment": "Great quality produce and excellent service"
}

Response (201 Created):
{
  "id": "cc0e8400-e29b-41d4-a716-446655440000",
  "offerId": "880e8400-e29b-41d4-a716-446655440000",
  "rating": 4.5,
  "comment": "Great quality produce and excellent service",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Ratings
```http
GET /ratings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "rating": 4.5,
      "comment": "Great quality produce and excellent service",
      "createdAt": "2024-01-20T12:00:00Z",
      "offer": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "status": "COMPLETED",
        "buyer": {
          "id": "660e8400-e29b-41d4-a716-446655440000",
          "name": "Jane Smith"
        },
        "produce": {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "type": "TOMATOES",
          "farmer": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "John Doe"
          }
        }
      }
    }
  ]
}
```

### Get Rating Details
```http
GET /ratings/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "cc0e8400-e29b-41d4-a716-446655440000",
  "rating": 4.5,
  "comment": "Great quality produce and excellent service",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z",
  "offer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "buyer": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Smith"
    },
    "produce": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "type": "TOMATOES",
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      }
    }
  }
}
```

> **Note**: Ratings can only be created for completed offers.

## Support Service

### Create Support Ticket
```http
POST /support
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "subject": "Issue with produce delivery",
  "description": "The produce quality does not match the listing description",
  "priority": "HIGH",
  "category": "QUALITY_ISSUE"
}

Response (201 Created):
{
  "id": "ee0e8400-e29b-41d4-a716-446655440000",
  "subject": "Issue with produce delivery",
  "description": "The produce quality does not match the listing description",
  "priority": "HIGH",
  "category": "QUALITY_ISSUE",
  "status": "OPEN",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Support Tickets
```http
GET /support
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "subject": "Issue with produce delivery",
      "description": "The produce quality does not match the listing description",
      "priority": "HIGH",
      "category": "QUALITY_ISSUE",
      "status": "OPEN",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### Get Support Ticket Details
```http
GET /support/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "ee0e8400-e29b-41d4-a716-446655440000",
  "subject": "Issue with produce delivery",
  "description": "The produce quality does not match the listing description",
  "priority": "HIGH",
  "category": "QUALITY_ISSUE",
  "status": "OPEN",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Update Support Ticket
```http
PATCH /support/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM"
}

Response (200 OK):
{
  "id": "ee0e8400-e29b-41d4-a716-446655440000",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Delete Support Ticket
```http
DELETE /support/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (204 No Content)
```

## Admin Service

### Get All Users
```http
GET /admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "isFarmer": true,
      "isBuyer": false,
      "isBlocked": false,
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### Get User Details
```http
GET /admin/users/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "isFarmer": true,
  "isBuyer": false,
  "isBlocked": false,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Block User
```http
POST /admin/users/:id/block
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "isBlocked": true,
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Unblock User
```http
POST /admin/users/:id/unblock
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "isBlocked": false,
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get Support Tickets
```http
GET /admin/support
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "subject": "Issue with produce delivery",
      "description": "The produce quality does not match the listing description",
      "priority": "HIGH",
      "category": "QUALITY_ISSUE",
      "status": "OPEN",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### Update Support Ticket Status
```http
PATCH /admin/support/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}

Response (200 OK):
{
  "id": "ee0e8400-e29b-41d4-a716-446655440000",
  "status": "IN_PROGRESS",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

## Notifications Service

### Get User's Notifications
```http
GET /notifications?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "notifications": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "type": "OFFER_CREATED",
      "title": "New Offer Received",
      "message": "You have received a new offer on your produce listing.",
      "status": "SENT",
      "metadata": {
        "offerId": "880e8400-e29b-41d4-a716-446655440000",
        "produceId": "770e8400-e29b-41d4-a716-446655440000",
        "buyerId": "660e8400-e29b-41d4-a716-446655440000"
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "sentAt": "2024-01-20T12:00:01Z",
      "readAt": null
    },
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440001",
      "type": "RATING_RECEIVED",
      "title": "New Rating Received",
      "message": "You have received a new rating.",
      "status": "READ",
      "metadata": {
        "ratingId": "cc0e8400-e29b-41d4-a716-446655440000"
      },
      "createdAt": "2024-01-19T15:00:00Z",
      "sentAt": "2024-01-19T15:00:01Z",
      "readAt": "2024-01-19T15:05:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

### Get Unread Notifications Count
```http
GET /notifications/unread/count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "count": 5
}
```

### Mark Notification as Read
```http
POST /notifications/:id/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "dd0e8400-e29b-41d4-a716-446655440000",
  "status": "READ",
  "readAt": "2024-01-20T12:30:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

> **Note**: Notifications are automatically created for various events:
> - New offer received
> - Offer updated
> - Offer accepted
> - Offer rejected
> - New rating received
> - Quality grade updated
> - Price updated
