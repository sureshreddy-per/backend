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

### Register a New User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123",
  "role": "FARMER"
}

Response (201 Created):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "FARMER",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "FARMER"
  }
}
```

### Get User Profile
```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "FARMER",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Reset Password Request
```http
POST /auth/reset-password-request
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200 OK):
{
  "message": "Password reset instructions sent to email",
  "requestId": "ff0e8400-e29b-41d4-a716-446655440000"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-123",
  "newPassword": "newSecurePassword123"
}

Response (200 OK):
{
  "message": "Password reset successful"
}
```

## Farmers Service

### Create Farmer Profile
```http
POST /farmers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get All Farmers
```http
GET /farmers?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
      "rating": 4.5
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

### Get Farmer Profile
```http
GET /farmers/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
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
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "TOMATOES",
  "quantity": 1000,
  "unit": "KG",
  "price": 25.50,
  "harvestDate": "2024-01-15",
  "description": "Fresh organic tomatoes",
  "images": ["image1.jpg", "image2.jpg"]
}

Response (201 Created):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "type": "TOMATOES",
  "quantity": 1000,
  "unit": "KG",
  "price": 25.50,
  "harvestDate": "2024-01-15",
  "description": "Fresh organic tomatoes",
  "images": ["image1.jpg", "image2.jpg"],
  "status": "PENDING",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get All Produce
```http
GET /produce?page=1&limit=10&type=TOMATOES&status=AVAILABLE
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "type": "TOMATOES",
      "quantity": 1000,
      "unit": "KG",
      "price": 25.50,
      "status": "AVAILABLE",
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "rating": 4.5
      }
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

### Update Produce Status
```http
PATCH /produce/:id/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "SOLD"
}

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "status": "SOLD",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

## Offers Service

### Create Offer
```http
POST /offers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "price": 23.50,
  "quantity": 500,
  "message": "Interested in buying half the quantity"
}

Response (201 Created):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "price": 23.50,
  "quantity": 500,
  "status": "PENDING",
  "message": "Interested in buying half the quantity",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Offers for Produce
```http
GET /offers/produce/:produceId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "price": 23.50,
      "quantity": 500,
      "status": "PENDING",
      "buyer": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "rating": 4.8
      },
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 5
  }
}
```

### Accept/Reject Offer
```http
PATCH /offers/:id/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "ACCEPTED",
  "message": "Offer accepted, please proceed with payment"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "status": "ACCEPTED",
  "message": "Offer accepted, please proceed with payment",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get Auto-Generated Offers
```http
GET /offers/auto-generated?produceId=770e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "produceId": "770e8400-e29b-41d4-a716-446655440000",
      "buyerId": "660e8400-e29b-41d4-a716-446655440000",
      "pricePerUnit": 25.50,
      "quantity": 1000,
      "status": "AUTO_GENERATED",
      "isAutoGenerated": true,
      "buyer": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "rating": 4.8
      },
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "nearbyBuyers": 8,
    "averagePrice": 24.75
  }
}
```

### Override Auto-Generated Offer
```http
PATCH /offers/:offerId/override
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "pricePerUnit": 24.00,
  "quantity": 800,
  "message": "Adjusting price and quantity based on market conditions"
}

Response (200 OK):
{
  "id": "880e8400-e29b-41d4-a716-446655440001",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "pricePerUnit": 24.00,
  "quantity": 800,
  "status": "PENDING",
  "isAutoGenerated": true,
  "overriddenAt": "2024-01-20T12:30:00Z",
  "message": "Adjusting price and quantity based on market conditions",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

## Transactions Service

### Create Transaction
```http
POST /transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "offerId": "880e8400-e29b-41d4-a716-446655440000",
  "paymentMethod": "BANK_TRANSFER",
  "paymentDetails": {
    "bankName": "Example Bank",
    "transactionId": "TXN123456"
  }
}

Response (201 Created):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "offerId": "880e8400-e29b-41d4-a716-446655440000",
  "amount": 11750.00,
  "status": "PENDING",
  "paymentMethod": "BANK_TRANSFER",
  "paymentDetails": {
    "bankName": "Example Bank",
    "transactionId": "TXN123456"
  },
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Transaction Details
```http
GET /transactions/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "offer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "price": 23.50,
    "quantity": 500
  },
  "amount": 11750.00,
  "status": "COMPLETED",
  "paymentMethod": "BANK_TRANSFER",
  "paymentDetails": {
    "bankName": "Example Bank",
    "transactionId": "TXN123456"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "completedAt": "2024-01-20T12:30:00Z"
}
```

## Quality Service

### Submit Quality Assessment
```http
POST /quality/assessments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "criteria": {
    "freshness": 5,
    "cleanliness": 4,
    "packaging": 5,
    "consistency": 4
  },
  "notes": "Excellent quality produce"
}

Response (201 Created):
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "overallGrade": "A",
  "criteria": {
    "freshness": 5,
    "cleanliness": 4,
    "packaging": 5,
    "consistency": 4
  },
  "notes": "Excellent quality produce",
  "assessedBy": "QUALITY_INSPECTOR",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Quality Assessment
```http
GET /quality/assessments/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "produce": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "type": "TOMATOES",
    "farmer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe"
    }
  },
  "overallGrade": "A",
  "criteria": {
    "freshness": 5,
    "cleanliness": 4,
    "packaging": 5,
    "consistency": 4
  },
  "notes": "Excellent quality produce",
  "assessedBy": {
    "id": "bb0e8400-e29b-41d4-a716-446655440000",
    "name": "Quality Inspector 1"
  },
  "createdAt": "2024-01-20T12:00:00Z"
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

### Submit Rating
```http
POST /ratings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "targetId": "550e8400-e29b-41d4-a716-446655440000",
  "targetType": "FARMER",
  "rating": 5,
  "review": "Excellent quality produce and professional service"
}

Response (201 Created):
{
  "id": "ee0e8400-e29b-41d4-a716-446655440000",
  "targetId": "550e8400-e29b-41d4-a716-446655440000",
  "targetType": "FARMER",
  "rating": 5,
  "review": "Excellent quality produce and professional service",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Ratings
```http
GET /ratings?targetId=550e8400-e29b-41d4-a716-446655440000&targetType=FARMER
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "rating": 5,
      "review": "Excellent quality produce and professional service",
      "reviewer": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith"
      },
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 10,
    "averageRating": 4.5
  }
}
```

## Support Service

### Create Support Ticket
```http
POST /support/tickets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "subject": "Payment Issue",
  "description": "Unable to complete payment for transaction ID: TXN123456",
  "priority": "HIGH",
  "category": "PAYMENT"
}

Response (201 Created):
{
  "id": "ff0e8400-e29b-41d4-a716-446655440000",
  "ticketNumber": "TKT-2024-001",
  "subject": "Payment Issue",
  "description": "Unable to complete payment for transaction ID: TXN123456",
  "priority": "HIGH",
  "category": "PAYMENT",
  "status": "OPEN",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get Support Ticket
```http
GET /support/tickets/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "ff0e8400-e29b-41d4-a716-446655440000",
  "ticketNumber": "TKT-2024-001",
  "subject": "Payment Issue",
  "description": "Unable to complete payment for transaction ID: TXN123456",
  "priority": "HIGH",
  "category": "PAYMENT",
  "status": "IN_PROGRESS",
  "assignedTo": {
    "id": "gg0e8400-e29b-41d4-a716-446655440000",
    "name": "Support Agent 1"
  },
  "messages": [
    {
      "id": "hh0e8400-e29b-41d4-a716-446655440000",
      "message": "We are looking into the payment issue",
      "sender": "SUPPORT",
      "createdAt": "2024-01-20T12:30:00Z"
    }
  ],
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

## Admin Service

### Get System Statistics
```http
GET /admin/statistics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "users": {
    "total": 1000,
    "farmers": 600,
    "buyers": 400,
    "activeToday": 150
  },
  "transactions": {
    "total": 500,
    "completed": 450,
    "pending": 50,
    "totalValue": 1000000
  },
  "produce": {
    "total": 200,
    "available": 150,
    "sold": 50
  },
  "support": {
    "openTickets": 20,
    "resolvedToday": 15
  }
}
```

### Block User
```http
POST /admin/users/:id/block
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reason": "Violation of terms of service",
  "duration": "PERMANENT"
}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "BLOCKED",
  "blockReason": "Violation of terms of service",
  "blockDuration": "PERMANENT",
  "blockedAt": "2024-01-20T12:00:00Z"
}
```

## Notifications Service

### Send Notification
```http
POST /notifications
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "OFFER_RECEIVED",
  "title": "New Offer Received",
  "message": "You have received a new offer for your tomatoes listing",
  "data": {
    "offerId": "880e8400-e29b-41d4-a716-446655440000"
  }
}

Response (201 Created):
{
  "id": "ii0e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "OFFER_RECEIVED",
  "title": "New Offer Received",
  "message": "You have received a new offer for your tomatoes listing",
  "data": {
    "offerId": "880e8400-e29b-41d4-a716-446655440000"
  },
  "status": "SENT",
  "createdAt": "2024-01-20T12:00:00Z"
}
```

### Get User Notifications
```http
GET /notifications?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "ii0e8400-e29b-41d4-a716-446655440000",
      "type": "OFFER_RECEIVED",
      "title": "New Offer Received",
      "message": "You have received a new offer for your tomatoes listing",
      "data": {
        "offerId": "880e8400-e29b-41d4-a716-446655440000"
      },
      "read": false,
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "unread": 10,
    "page": 1,
    "limit": 10,
    "hasNext": true
  }
}
```

### Auto-Offer Notifications Example
```http
GET /notifications?type=OFFER_CREATED&isAutoGenerated=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "ii0e8400-e29b-41d4-a716-446655440001",
      "type": "OFFER_CREATED",
      "title": "Multiple Auto-Generated Offers Received",
      "message": "Your Tomatoes (Grade: A) has received 5 offers from buyers in your area:\n\nBuyer Co: $25.00 per kg\nFresh Foods Inc: $24.50 per kg\nLocal Market: $26.00 per kg\n...",
      "metadata": {
        "produceId": "770e8400-e29b-41d4-a716-446655440000",
        "offerIds": [
          "880e8400-e29b-41d4-a716-446655440001",
          "880e8400-e29b-41d4-a716-446655440002"
        ],
        "totalOffers": 5,
        "averagePrice": 25.10
      },
      "read": false,
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 10,
    "unread": 3,
    "page": 1,
    "limit": 10,
    "hasNext": false
  }
}
```

### Auto-Offer Expiry Rules
```http
GET /offers/auto-generated/rules
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "expiryRules": {
    "priceChangeExpiry": true,
    "defaultExpiryHours": 24,
    "graceMinutes": 15,
    "maxActiveOffersPerProduce": 10
  },
  "concurrencyRules": {
    "maxSimultaneousOffers": 3,
    "priorityOrder": ["rating", "distance", "historicalTransactions"]
  }
}
```

### Update Auto-Offer Rules
```http
PATCH /offers/auto-generated/rules
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "expiryRules": {
    "priceChangeExpiry": true,
    "defaultExpiryHours": 48,
    "graceMinutes": 30
  }
}

Response (200 OK):
{
  "message": "Auto-offer rules updated successfully",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get Expired Auto-Offers
```http
GET /offers/auto-generated/expired
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "produceId": "770e8400-e29b-41d4-a716-446655440000",
      "status": "EXPIRED",
      "expiryReason": "PRICE_CHANGED",
      "originalPrice": 25.50,
      "newPrice": 26.00,
      "expiredAt": "2024-01-20T14:30:00Z",
      "buyer": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith"
      }
    }
  ],
  "meta": {
    "total": 3,
    "expiryReasons": {
      "PRICE_CHANGED": 2,
      "TIME_EXPIRED": 1
    }
  }
}
```

### Get Auto-Offer Queue Status
```http
GET /offers/auto-generated/queue/:produceId
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "produceId": "770e8400-e29b-41d4-a716-446655440000",
  "activeOffers": 3,
  "queuedOffers": 2,
  "maxAllowed": 10,
  "buyers": {
    "active": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "priority": 85,
        "offerStatus": "PENDING",
        "queuePosition": 1
      }
    ],
    "queued": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "name": "Bob's Market",
        "priority": 75,
        "queuePosition": 4
      }
    ]
  },
  "lastProcessed": "2024-01-20T12:00:00Z",
  "nextProcessing": "2024-01-20T12:15:00Z"
}
```

### Handle Price Change Impact
```http
POST /buyers/:buyerId/prices/change-impact
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "qualityGrade": "A",
  "oldPrice": 25.50,
  "newPrice": 26.00,
  "effectiveDate": "2024-02-01"
}

Response (200 OK):
{
  "impactedOffers": {
    "total": 5,
    "autoExpired": 3,
    "requiresAction": 2
  },
  "notifications": {
    "farmers": 4,
    "sent": true
  },
  "newOffers": {
    "queued": 3,
    "processing": true
  },
  "transitionPeriod": {
    "start": "2024-02-01T00:00:00Z",
    "end": "2024-02-01T00:15:00Z"
  }
}
```

### Get Price Change History
```http
GET /buyers/:buyerId/prices/history?grade=A
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "qualityGrade": "A",
      "oldPrice": 25.50,
      "newPrice": 26.00,
      "effectiveDate": "2024-02-01",
      "impact": {
        "offersAffected": 5,
        "autoExpired": 3,
        "newOffersGenerated": 3
      },
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

## Buyer Prices API

### Set Daily Price
```http
POST /buyer-prices
Authorization: Bearer <token>

{
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "qualityGrade": "A",
  "pricePerUnit": 25.50,
  "effectiveDate": "2024-02-01"
}

Response (201):
{
  "id": "7b8e8400-e29b-41d4-a716-446655441111",
  "buyerId": "550e8400-e29b-41d4-a716-446655440000",
  "qualityGrade": "A",
  "pricePerUnit": 25.50,
  "effectiveDate": "2024-02-01",
  "isActive": true,
  "createdAt": "2024-01-31T15:00:00Z",
  "updatedAt": "2024-01-31T15:00:00Z"
}
```

### Update Price
```http
PATCH /buyer-prices/7b8e8400-e29b-41d4-a716-446655441111
Authorization: Bearer <token>

{
  "pricePerUnit": 26.00,
  "effectiveDate": "2024-02-01"
}

Response (200):
{
  "id": "7b8e8400-e29b-41d4-a716-446655441111",
  "pricePerUnit": 26.00,
  "effectiveDate": "2024-02-01",
  "isActive": true,
  "updatedAt": "2024-01-31T16:00:00Z"
}
```

### Get Current Prices
```http
GET /buyer-prices/550e8400-e29b-41d4-a716-446655440000/current?grade=A
Authorization: Bearer <token>

Response (200):
{
  "prices": [
    {
      "id": "7b8e8400-e29b-41d4-a716-446655441111",
      "qualityGrade": "A",
      "pricePerUnit": 26.00,
      "effectiveDate": "2024-02-01",
      "isActive": true
    }
  ]
}
```

### Get Price History
```http
GET /buyer-prices/550e8400-e29b-41d4-a716-446655440000/history?grade=A&startDate=2024-01-01&endDate=2024-02-01
Authorization: Bearer <token>

Response (200):
{
  "history": [
    {
      "id": "7b8e8400-e29b-41d4-a716-446655441111",
      "qualityGrade": "A",
      "pricePerUnit": 26.00,
      "effectiveDate": "2024-02-01",
      "isActive": true
    },
    {
      "id": "7b8e8400-e29b-41d4-a716-446655442222",
      "qualityGrade": "A",
      "pricePerUnit": 24.50,
      "effectiveDate": "2024-01-15",
      "isActive": false
    }
  ]
}
```

## Auto-Generated Offers API

### Get Auto-Generated Offers
```http
GET /offers/auto-generated?produceId=660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>

Response (200):
{
  "offers": [
    {
      "id": "8b8e8400-e29b-41d4-a716-446655441111",
      "produceId": "660e8400-e29b-41d4-a716-446655440000",
      "buyerId": "550e8400-e29b-41d4-a716-446655440000",
      "pricePerUnit": 26.00,
      "quantity": 1000,
      "status": "AUTO_GENERATED",
      "isAutoGenerated": true,
      "createdAt": "2024-02-01T10:00:00Z"
    }
  ]
}
```

### Override Auto-Generated Offer
```http
PATCH /offers/8b8e8400-e29b-41d4-a716-446655441111/override
Authorization: Bearer <token>

{
  "pricePerUnit": 25.00,
  "quantity": 800,
  "message": "Adjusting based on market conditions"
}

Response (200):
{
  "id": "8b8e8400-e29b-41d4-a716-446655441111",
  "pricePerUnit": 25.00,
  "quantity": 800,
  "status": "PENDING",
  "message": "Adjusting based on market conditions",
  "overriddenAt": "2024-02-01T11:00:00Z"
}
```

### Get Queue Status
```http
GET /offers/auto-generated/queue/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>

Response (200):
{
  "produceId": "660e8400-e29b-41d4-a716-446655440000",
  "activeOffers": 2,
  "queuedOffers": 3,
  "buyers": {
    "queued": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Buyer A",
        "queuePosition": 1
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Buyer B",
        "queuePosition": 2
      }
    ]
  }
}
```

### Get Expired Auto-Offers
```http
GET /offers/auto-generated/expired?buyerId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>

Response (200):
{
  "offers": [
    {
      "id": "8b8e8400-e29b-41d4-a716-446655442222",
      "produceId": "660e8400-e29b-41d4-a716-446655440000",
      "buyerId": "550e8400-e29b-41d4-a716-446655440000",
      "pricePerUnit": 24.50,
      "quantity": 1000,
      "status": "EXPIRED",
      "isAutoGenerated": true,
      "expirationReason": "PRICE_CHANGE",
      "expiredAt": "2024-02-01T09:00:00Z"
    }
  ]
}
```
