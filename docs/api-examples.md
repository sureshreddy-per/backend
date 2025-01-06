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

### Public Endpoints (No Authentication Required)

#### Check Mobile Number
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

#### Register New User
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

#### Request OTP (Login)
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

#### Verify OTP
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

### Protected Endpoints (Authentication Required)

#### Logout
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Successfully logged out"
}
```

#### Delete Account
```http
DELETE /auth/account
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Account scheduled for deletion. Data will be permanently removed after 30 days."
}
```

#### Validate Token
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

> **Authentication Notes**:
> 1. Public endpoints do not require any authentication
> 2. Protected endpoints require a valid JWT token in the Authorization header
> 3. JWT token is obtained after successful OTP verification
> 4. Token contains user ID, roles, and expiration time
> 5. Invalid or expired tokens will receive a 401 Unauthorized response

## Farmers Service

### Create/Update Farmer Profile
```http
POST /farmers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

# Full Create Example
{
  "farms": [{
    "name": "Main Farm",
    "size": 50,
    "sizeUnit": "acres",
    "address": "123 Farm Road",
    "location": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  }],
  "bankDetails": {
    "accountName": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "Agricultural Bank",
    "branchCode": "AGR001"
  }
}

Response (201 Created):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440000",
  "farms": [{
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Main Farm",
    "size": 50,
    "sizeUnit": "acres",
    "address": "123 Farm Road",
    "location": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  }],
  "rating": 0,
  "totalRatings": 0,
  "bankAccounts": [{
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "accountName": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "Agricultural Bank",
    "branchCode": "AGR001",
    "isPrimary": true
  }],
  "produceCount": 0,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}

### Get All Farmers
```http
GET /farmers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "660e8400-e29b-41d4-a716-446655440000",
    "farms": [{
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Main Farm",
      "size": 50,
      "sizeUnit": "acres",
      "address": "123 Farm Road",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    }],
    "rating": 4.5,
    "totalRatings": 10,
    "produceCount": 5,
    "produce": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "name": "Fresh Tomatoes",
        "status": "AVAILABLE"
      }
    ]
  }
]
```

### Get Farmer Profile
```http
GET /farmers/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

# Sample CURL
```bash
# Get farmer profile
curl -X GET 'http://localhost:3000/farmers/profile' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'

# Using httpie
http GET 'http://localhost:3000/farmers/profile' \
  Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'
```

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440000",
  "rating": 4.5,
  "totalRatings": 10,
  "farms": [{
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Main Farm",
    "size": 50,
    "sizeUnit": "acres",
    "address": "123 Farm Road",
    "location": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  }],
  "bankAccounts": [{
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "accountName": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "Agricultural Bank",
    "branchCode": "AGR001",
    "isPrimary": true
  }],
  "produceCount": 5,
  "produce": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "quantity": 500,
      "unit": "kg",
      "price": 25.50,
      "pricePerUnit": 25.50,
      "currency": "USD",
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

# Sample CURL
```bash
# Get produce history for a date range
curl -X GET 'http://localhost:3000/farmers/profile/produce-history?startDate=2024-01-01&endDate=2024-01-31' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'

# Get all produce history (no date filter)
curl -X GET 'http://localhost:3000/farmers/profile/produce-history' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'

# Using httpie
http GET 'http://localhost:3000/farmers/profile/produce-history' \
  startDate==2024-01-01 \
  endDate==2024-01-31 \
  Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'
```

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

# Sample CURL
```bash
# Basic nearby search with default radius (10km)
curl -X GET 'http://localhost:3000/farmers/nearby?lat=12.9716&lng=77.5946' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'

# Search with custom radius (5km)
curl -X GET 'http://localhost:3000/farmers/nearby?lat=12.9716&lng=77.5946&radius=5' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'

# Using httpie (alternative to curl)
http GET 'http://localhost:3000/farmers/nearby?lat=12.9716&lng=77.5946&radius=10' \
  Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...'
```

Response (200 OK):
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "660e8400-e29b-41d4-a716-446655440000",
      "rating": 4.5,
      "totalRatings": 10,
      "distance": 2.5,
      "produceCount": 5,
      "farms": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "name": "Main Farm",
          "size": 50,
          "sizeUnit": "acres",
          "address": "123 Farm Road",
          "location": {
            "lat": 12.9716,
            "lng": 77.5946
          }
        }
      ],
      "produce": [
        {
          "id": "990e8400-e29b-41d4-a716-446655440000",
          "name": "Fresh Tomatoes",
          "quantity": 500,
          "unit": "kg",
          "price": 25.50,
          "pricePerUnit": 25.50,
          "currency": "USD",
          "status": "AVAILABLE"
        }
      ],
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

> **Nearby Search Notes**:
> 1. Uses Haversine formula to calculate distances accurately
> 2. Distance is returned in kilometers
> 3. Results are sorted by distance (closest first)
> 4. Includes all farms and produce for each farmer
> 5. The distance shown is to the nearest farm of the farmer
> 6. Default radius is 10 kilometers if not specified
> 7. Location coordinates should be in decimal degrees (e.g., 12.9716)
> 8. Returns farmers who have at least one farm within the specified radius

### Bank Account Management

#### Add Bank Account
```http
POST /farmers/bank-accounts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "accountName": "John Doe",
  "accountNumber": "9876543210",
  "bankName": "Second Bank",
  "branchCode": "SB001"
}

Response (201 Created):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "accountName": "John Doe",
  "accountNumber": "9876543210",
  "bankName": "Second Bank",
  "branchCode": "SB001",
  "isPrimary": false,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

#### Set Primary Bank Account
```http
PUT /farmers/bank-accounts/:id/primary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "accountName": "John Doe",
  "accountNumber": "9876543210",
  "bankName": "Second Bank",
  "branchCode": "SB001",
  "isPrimary": true,
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

#### Delete Bank Account
```http
DELETE /farmers/bank-accounts/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Bank account deleted successfully"
}
```

> **Farmers Service Notes**:
> 1. All endpoints (except GET /farmers) require FARMER role
> 2. Farmer profile is automatically created when a user with FARMER role registers
> 3. A farmer can have:
>    - Multiple farms (each with its own location)
>    - Multiple bank accounts (one marked as primary)
>    - Multiple produce listings (optionally associated with specific farms)
> 4. The produceCount field is calculated based on active produce listings
> 5. Nearby farmers are found using Haversine formula with the specified radius in kilometers
> 6. Farm details and bank accounts are included in responses when available
> 7. All timestamps are in ISO 8601 format with UTC timezone
> 8. The rating system uses a scale of 0-5 with one decimal place precision

## Produce Service

### Create Produce Listing
```http
POST /api/v1/produce
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Fresh Tomatoes",
  "description": "Fresh, ripe tomatoes harvested from organic farm",
  "farmId": "770e8400-e29b-41d4-a716-446655440000",
  "quantity": 500,
  "unit": "kg",
  "price": 25.50,
  "pricePerUnit": 25.50,
  "currency": "USD",
  "category": "VEGETABLE",
  "harvestedAt": "2024-01-19T00:00:00Z",
  "expiryDate": "2024-02-19T00:00:00Z",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "Farm location"
  },
  "images": ["image1.jpg", "image2.jpg"]
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
  "category": "VEGETABLE",
  "status": "AVAILABLE",
  "harvestedAt": "2024-01-19T00:00:00Z",
  "expiryDate": "2024-02-19T00:00:00Z",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "Farm location"
  },
  "images": ["image1.jpg", "image2.jpg"],
  "qualityGrade": null,
  "farmer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "farm": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Main Farm",
    "address": "123 Farm Road"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Produce
```http
GET /api/v1/produce
Query Parameters:
- page (default: 1)
- limit (default: 10)
- category (enum: VEGETABLE, FRUIT, GRAIN, OTHER)
- minPrice (number)
- maxPrice (number)
- lat (number)
- lng (number)
- radius (number, in km)
- farmId (uuid)
- sortBy (enum: PRICE_ASC, PRICE_DESC, DISTANCE, CREATED_AT)
- status (enum: AVAILABLE, IN_PROGRESS, SOLD, CANCELLED)

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
      "category": "VEGETABLE",
      "status": "AVAILABLE",
      "harvestedAt": "2024-01-19T00:00:00Z",
      "expiryDate": "2024-02-19T00:00:00Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946,
        "address": "Farm location"
      },
      "images": ["image1.jpg", "image2.jpg"],
      "qualityGrade": "A",
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "rating": 4.5
      },
      "farm": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Main Farm",
        "address": "123 Farm Road"
      },
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:30:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

### Find Nearby Produce
```http
GET /api/v1/produce/nearby
Query Parameters:
- latitude (required)
- longitude (required)
- radius (default: 10, in km)
- limit (default: 20)
- category (enum: VEGETABLE, FRUIT, GRAIN, OTHER)
- status (enum: AVAILABLE, IN_PROGRESS, SOLD, CANCELLED)

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "distance": 2.5,
      "category": "VEGETABLE",
      "price": 25.50,
      "pricePerUnit": 25.50,
      "currency": "USD",
      "status": "AVAILABLE",
      "images": ["image1.jpg"],
      "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "rating": 4.5
      }
    }
  ],
  "meta": {
    "total": 5,
    "hasMore": false
  }
}
```

### Get Produce by ID
```http
GET /api/v1/produce/:id
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
  "category": "VEGETABLE",
  "status": "AVAILABLE",
  "harvestedAt": "2024-01-19T00:00:00Z",
  "expiryDate": "2024-02-19T00:00:00Z",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "Farm location"
  },
  "images": ["image1.jpg", "image2.jpg"],
  "qualityGrade": "A",
  "farmer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "rating": 4.5
  },
  "qualityAssessment": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "grade": "A",
    "notes": "Excellent quality produce",
    "assessedAt": "2024-01-20T12:00:00Z"
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Get My Produce Listings
```http
GET /api/v1/produce/my-listings
Query Parameters:
- status (enum: AVAILABLE, IN_PROGRESS, SOLD, CANCELLED)
- page (default: 1)
- limit (default: 10)
- sortBy (enum: CREATED_AT_DESC, CREATED_AT_ASC)

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
      "category": "VEGETABLE",
      "status": "AVAILABLE",
      "harvestedAt": "2024-01-19T00:00:00Z",
      "expiryDate": "2024-02-19T00:00:00Z",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946,
        "address": "Farm location"
      },
      "images": ["image1.jpg", "image2.jpg"],
      "qualityGrade": "A",
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:30:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "hasMore": false
  }
}
```

### Update Produce
```http
PUT /api/v1/produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "price": 27.50,
  "pricePerUnit": 27.50,
  "quantity": 450,
  "description": "Updated description for fresh tomatoes",
  "status": "IN_PROGRESS",
  "expiryDate": "2024-02-25T00:00:00Z",
  "images": ["image1.jpg", "image3.jpg"]
}

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "price": 27.50,
  "pricePerUnit": 27.50,
  "quantity": 450,
  "description": "Updated description for fresh tomatoes",
  "status": "IN_PROGRESS",
  "expiryDate": "2024-02-25T00:00:00Z",
  "images": ["image1.jpg", "image3.jpg"],
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Delete Produce
```http
DELETE /api/v1/produce/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Produce deleted successfully",
  "id": "770e8400-e29b-41d4-a716-446655440000"
}
```

> **Produce Service Notes**:
> 1. All endpoints require authentication
> 2. Only farmers can create, update, and delete their own produce listings
> 3. Produce categories: VEGETABLE, FRUIT, GRAIN, OTHER
> 4. Status can be: AVAILABLE, IN_PROGRESS, SOLD, CANCELLED
> 5. Images should be uploaded separately using the File Upload Service
> 6. Quality assessment is performed by authorized inspectors
> 7. Location coordinates are in decimal degrees (e.g., 12.9716)
> 8. Prices must be positive numbers
> 9. Dates must be in ISO 8601 format
> 10. Pagination is available for list endpoints
> 11. Nearby search uses Haversine formula for distance calculation
> 12. Currency must be a valid ISO 4217 code (e.g., USD, EUR)

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

## Farm Management APIs

### Add New Farm
```http
POST /farmers/farms
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "New Farm",
  "size": 25,
  "sizeUnit": "acres",
  "address": "789 Farm Road",
  "location": {
    "lat": 12.9720,
    "lng": 77.5950
  }
}

Response (201 Created):
{
  "id": "771e8400-e29b-41d4-a716-446655440000",
  "name": "New Farm",
  "size": 25,
  "sizeUnit": "acres",
  "address": "789 Farm Road",
  "location": {
    "lat": 12.9720,
    "lng": 77.5950
  },
  "farmerId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Farms
```http
GET /farmers/farms
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "farms": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Main Farm",
      "size": 50,
      "sizeUnit": "acres",
      "address": "123 Farm Road",
      "location": {
        "lat": 12.9716,
        "lng": 77.5946
      },
      "produceCount": 3
    },
    {
      "id": "771e8400-e29b-41d4-a716-446655440000",
      "name": "New Farm",
      "size": 25,
      "sizeUnit": "acres",
      "address": "789 Farm Road",
      "location": {
        "lat": 12.9720,
        "lng": 77.5950
      },
      "produceCount": 0
    }
  ]
}
```

### Get Farm Details
```http
GET /farmers/farms/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Main Farm",
  "size": 50,
  "sizeUnit": "acres",
  "address": "123 Farm Road",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "produceCount": 3,
  "produces": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "quantity": 100,
      "unit": "kg",
      "price": 2.5,
      "pricePerUnit": "USD",
      "status": "AVAILABLE"
    }
  ]
}
```

### Update Farm Details
```http
PUT /farmers/farms/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Updated Farm Name",
  "size": 60,
  "sizeUnit": "acres",
  "address": "Updated Farm Address",
  "location": {
    "lat": 12.9718,
    "lng": 77.5948
  }
}

Response (200 OK):
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Farm Name",
  "size": 60,
  "sizeUnit": "acres",
  "address": "Updated Farm Address",
  "location": {
    "lat": 12.9718,
    "lng": 77.5948
  },
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

### Delete Farm
```http
DELETE /farmers/farms/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "message": "Farm deleted successfully"
}
```

### Get Farm Produce
```http
GET /farmers/farms/:id/produce
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInT5cCI6IkpXVCJ9...

Response (200 OK):
{
  "produces": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "Fresh Tomatoes",
      "quantity": 100,
      "unit": "kg",
      "price": 2.5,
      "pricePerUnit": "USD",
      "status": "AVAILABLE",
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "totalValue": 250
  }
}
```

> **Farm Management Notes**:
> 1. All farm management endpoints require FARMER role
> 2. All fields in create/update requests are optional
> 3. Farms can be created independently or as part of farmer profile creation
> 4. A farmer can have multiple farms
> 5. Each farm can have multiple produce listings
> 6. Farms with active produce listings cannot be deleted
> 7. Farm location and size details are optional
> 8. Farm size units can be: acres, hectares, square_meters
> 9. When creating produce, you can optionally specify which farm it belongs to
> 10. Farm details are included in produce responses when farmId is specified

## File Upload Service

### Upload Produce Images
```http
POST /produce/images/{produceId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

Form Data:
- images: [File1, File2, ...]

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrls": [
    "https://your-bucket.s3.region.amazonaws.com/produce/image1-uuid.jpg",
    "https://your-bucket.s3.region.amazonaws.com/produce/image2-uuid.jpg"
  ],
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Delete Produce Image
```http
DELETE /produce/images/{produceId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "imageUrl": "https://your-bucket.s3.region.amazonaws.com/produce/image1-uuid.jpg"
}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrls": [
    "https://your-bucket.s3.region.amazonaws.com/produce/image2-uuid.jpg"
  ],
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

> **File Upload Notes**:
> 1. All file uploads require authentication
> 2. Images are stored in AWS S3 and served via HTTPS
> 3. Maximum file size: 5MB per image
> 4. Supported image formats: jpg, jpeg, png, gif
> 5. Maximum 5 images per upload request
> 6. Images are automatically resized and optimized
> 7. Original filenames are preserved in the metadata
> 8. URLs are publicly accessible but tamper-proof
> 9. Failed uploads are automatically retried
> 10. Old images are automatically cleaned up
