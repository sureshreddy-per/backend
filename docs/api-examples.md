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
