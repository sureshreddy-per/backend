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
13. [File Upload Service](#file-upload-service)

## Auth Service

### Check Mobile Number
```http
POST /auth/check-mobile
Content-Type: application/json

{
  "mobileNumber": "+1234567890"
}

Response (200 OK):
{
  "isRegistered": false
}
```

### Register New User (Only for new users)
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "mobileNumber": "+1234567890",
  "email": "john@example.com",
  "roles": ["FARMER"]
}

Response (201 Created):
{
  "requestId": "abc123xyz",
  "message": "User registered successfully. OTP sent: 123456"
}
```

### Request OTP (Login)
```http
POST /auth/otp/request
Content-Type: application/json

{
  "mobileNumber": "+1234567890"
}

Response (200 OK):
{
  "requestId": "abc123xyz",
  "message": "OTP sent successfully: 123456"
}
```

### Verify OTP
```http
POST /auth/otp/verify
Content-Type: application/json

{
  "mobileNumber": "+1234567890",
  "otp": "123456"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "mobileNumber": "+1234567890",
    "email": "john@example.com",
    "roles": ["FARMER"],
    "status": "ACTIVE"
  }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Successfully logged out"
}
```

### Delete Account
```http
DELETE /auth/account
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Account scheduled for deletion. Data will be permanently removed after 30 days."
}
```

> **Note**: When an account is deleted:
> 1. The account is immediately marked as deleted and user cannot login
> 2. All data is kept for 30 days before permanent deletion
> 3. User can register again with the same mobile number after deletion
> 4. Existing authentication tokens are invalidated

### Validate Token
```http
GET /auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "valid": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "mobileNumber": "+1234567890",
    "roles": ["FARMER"],
    "status": "ACTIVE"
  }
}
```

## Farmers Service

### Create/Update Farmer Profile
```http
POST /farmers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "farmDetails": {
    "size": "50",
    "sizeUnit": "acres"
  }
}

Response (201 Created):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "farmSize": 50,
  "farmSizeUnit": "acres",
  "rating": 0,
  "totalRatings": 0,
  "isActive": true,
  "produceCount": 0,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get Farmer Profile
```http
GET /farmers/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "farmSize": 50,
  "farmSizeUnit": "acres",
  "rating": 4.5,
  "totalRatings": 10,
  "isActive": true,
  "produceCount": 5,
  "produce": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Tomatoes",
      "status": "AVAILABLE"
    }
  ],
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get Farmer's Produce History
```http
GET /farmers/profile/produce-history?startDate=2024-01-01&endDate=2024-01-31
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

### Find Nearby Farmers
```http
GET /farmers/nearby?lat=12.9716&lng=77.5946&radius=10
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
      "distance": 2.5,
      "rating": 4.5,
      "produceCount": 5
    }
  ]
}
```

## Produce Service

### Create Produce Listing
```http
POST /produce
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Fresh Tomatoes",
  "description": "Fresh, ripe tomatoes harvested from organic farm",
  "quantity": 500,
  "unit": "kg",
  "price": 25.50,
  "pricePerUnit": 25.50,
  "currency": "USD",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}

Response (201 Created):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Fresh Tomatoes",
  "description": "Fresh, ripe tomatoes harvested from organic farm",
  "quantity": 500,
  "unit": "kg",
  "price": 25.50,
  "pricePerUnit": 25.50,
  "currency": "USD",
  "status": "AVAILABLE",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "qualityGrade": null,
  "farmer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Produce
```http
GET /produce?page=1&limit=10&type=vegetable&minPrice=10&maxPrice=50&lat=12.9716&lng=77.5946&radius=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "description": "Fresh, ripe tomatoes harvested from organic farm",
      "quantity": 500,
      "unit": "kg",
      "price": 25.50,
      "pricePerUnit": 25.50,
      "currency": "USD",
      "status": "AVAILABLE",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
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
  "total": 100,
  "hasMore": true
}
```

### Find Nearby Produce
```http
GET /produce/nearby?latitude=12.9716&longitude=77.5946&radiusInKm=10&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "distance": 2.5, // Distance in kilometers
      "price": 25.50,
      "pricePerUnit": 25.50,
      "currency": "USD",
      "status": "AVAILABLE",
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "rating": 4.5
      }
    }
  ]
}
```

### Get Produce by ID
```http
GET /produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Fresh Tomatoes",
  "description": "Fresh, ripe tomatoes harvested from organic farm",
  "quantity": 500,
  "unit": "kg",
  "price": 25.50,
  "pricePerUnit": 25.50,
  "currency": "USD",
  "status": "AVAILABLE",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "qualityGrade": "A",
  "farmer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "rating": 4.5
  },
  "qualityAssessment": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "grade": "A",
    "notes": "Excellent quality produce"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get My Produce Listings
```http
GET /produce/my-listings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "description": "Fresh, ripe tomatoes harvested from organic farm",
      "quantity": 500,
      "unit": "kg",
      "price": 25.50,
      "pricePerUnit": 25.50,
      "currency": "USD",
      "status": "AVAILABLE",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "qualityGrade": "A",
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:30:00Z"
    }
  ]
}
```

### Update Produce
```http
PUT /produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "price": 27.50,
  "pricePerUnit": 27.50,
  "quantity": 450,
  "description": "Updated description for fresh tomatoes",
  "status": "IN_PROGRESS"
}

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "price": 27.50,
  "pricePerUnit": 27.50,
  "quantity": 450,
  "description": "Updated description for fresh tomatoes",
  "status": "IN_PROGRESS",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Delete Produce
```http
DELETE /produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000"
}
```

> **Note**: Only farmers can create, update, and delete their own produce listings.
> The produce status can be one of: AVAILABLE, IN_PROGRESS, SOLD, CANCELLED

## Offers Service

### Create Manual Offer
```http
POST /offers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "pricePerUnit": 23.50,
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

### Get Auto-Generated Offers for Produce
```http
GET /offers/auto/produce/:produceId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "offers": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "buyerId": "660e8400-e29b-41d4-a716-446655440000",
      "pricePerUnit": 25.50,
      "quantity": 500,
      "status": "PENDING",
      "metadata": {
        "qualityGrade": "A",
        "autoGeneratedAt": "2024-01-20T12:00:00Z",
        "priceHistory": [],
        "lastPriceUpdate": {
          "oldPrice": 0,
          "newPrice": 25.50,
          "timestamp": "2024-01-20T12:00:00Z"
        }
      }
    }
  ]
}
```

### Get Auto-Generated Offers for Buyer
```http
GET /offers/auto/buyer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "offers": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "produceId": "770e8400-e29b-41d4-a716-446655440000",
      "pricePerUnit": 25.50,
      "quantity": 500,
      "status": "PENDING",
      "metadata": {
        "qualityGrade": "A",
        "autoGeneratedAt": "2024-01-20T12:00:00Z",
        "priceHistory": [],
        "lastPriceUpdate": {
          "oldPrice": 0,
          "newPrice": 25.50,
          "timestamp": "2024-01-20T12:00:00Z"
        }
      },
      "produce": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Fresh Tomatoes",
        "farmer": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe",
          "rating": 4.5
        }
      }
    }
  ]
}
```

### Accept Offer (Farmer Only)
```http
POST /offers/:id/accept
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "status": "ACCEPTED",
  "acceptedAt": "2024-01-20T12:30:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Reject Offer (Farmer Only)
```http
POST /offers/:id/reject
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
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

### Cancel Offer (Buyer Only)
```http
POST /offers/:id/cancel
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
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

### Get My Offers
```http
GET /offers/my-offers?status=PENDING
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
      "metadata": {
        "qualityGrade": "A",
        "autoGeneratedAt": null,
        "priceHistory": []
      },
      "produce": {
        "name": "Fresh Tomatoes",
        "farmer": {
          "name": "John Doe",
          "rating": 4.5
        }
      },
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

> **Note**: 
> 1. Offers can be created manually by buyers or auto-generated by the system
> 2. Auto-generated offers are created for nearby buyers when new produce is listed
> 3. Auto-generated offers are created for buyers based on their location and preferences
> 4. Offer status can be: PENDING, ACCEPTED, REJECTED, CANCELLED
> 5. Only farmers can accept/reject offers for their produce
> 6. Only buyers can cancel their own offers

# Error Responses

## Authentication Errors

### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized access",
  "error": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### Token Expired (401)
```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized"
}
```

## Validation Errors

### Invalid Input (400)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "price must be a positive number"
    }
  ]
}
```

### Resource Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### Conflict (409)
```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Conflict"
}
```

# Authentication Notes

1. All endpoints (except auth endpoints) require JWT token authentication
2. Token must be included in Authorization header
3. Token contains:
   - User ID
   - User roles (FARMER, BUYER, ADMIN)
   - Token expiration

# Role-Based Access

1. FARMER role can:
   - Manage their profile
   - Create/update/delete produce listings
   - Accept/reject offers
   - View their transactions

2. BUYER role can:
   - Manage their profile
   - View produce listings
   - Create/cancel offers
   - View their transactions

3. ADMIN role can:
   - Access all endpoints
   - Manage all resources
   - View system metrics
