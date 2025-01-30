# AgroChain Farmer API Documentation

Base URL: https://backend-production-2944.up.railway.app/api

## Common Response Patterns

### Paginated Response
Many list endpoints return paginated responses in this format:
```json
{
    "items": T[],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
}
```

### Error Response
Error responses follow this format:
```json
{
    "statusCode": number,
    "message": string,
    "error": string
}
```

## Table of Contents
- [Authentication](#authentication)
- [Profile](#profile)
- [Home](#home)
- [Produce](#produce)
- [Inspections](#inspections)
- [Offers](#offers)
- [Transactions](#transactions)
- [Ratings](#ratings)

## Authentication

### Check Mobile
```http
POST /auth/check-mobile
Content-Type: application/json

{
    "mobile_number": "+918880920045"
}

Response:
{
    "isRegistered": false
}

Example Response (Registered User):
{
    "isRegistered": true
}
```

### Register Farmer
```http
POST /auth/register
Content-Type: application/json

{
    "mobile_number": "+918880920045",
    "name": "Farmer Name",
    "email": "farmer@example.com",
    "role": "FARMER"
}

Response:
{
    "requestId": string,
    "message": string
}

Example Response:
{
    "requestId": "abc123xyz456",
    "message": "User registered successfully. OTP sent to +918880920045"
}
```

### Request OTP
```http
POST /auth/otp/request
Content-Type: application/json

{
    "mobile_number": "+918880920045"
}

Response:
{
    "requestId": string,
    "message": string
}

Example Response:
{
    "requestId": "def456uvw789",
    "message": "OTP sent successfully to +918880920045"
}
```

### Verify OTP
```http
POST /auth/otp/verify
Content-Type: application/json

{
    "mobile_number": "+918880920045",
    "otp": "820265",
    "app_version": "1.0.0"
}

Response:
{
    "token": string,
    "user": {
        "id": string,
        "mobile_number": string,
        "email": string,
        "name": string,
        "role": string,
        "status": string,
        "avatar_url": string,
        "rating": number,
        "total_completed_transactions": number,
        "app_version": string,
        "last_login_at": string,
        "created_at": string,
        "updated_at": string
    }
}

Example Response:
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "mobile_number": "+918880920045",
        "email": "farmer@example.com",
        "name": "Farmer Name",
        "role": "FARMER",
        "status": "ACTIVE",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5,
        "total_completed_transactions": 10,
        "app_version": "1.0.0",
        "last_login_at": "2024-03-15T10:30:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-03-15T10:30:00Z"
    }
}
```

### Delete Account
```http
DELETE /auth/account
Authorization: Bearer {farmer_token}

Response: No content (204)
```

### Validate Token
```http
GET /auth/validate?current_version=1.0.0&app_type=FARMER
Authorization: Bearer {farmer_token}

Response:
{
    "valid": boolean,
    "user": {
        // Same structure as user object in Verify OTP response
    },
    "app_status": {
        "needsUpdate": boolean,
        "forceUpdate": boolean,
        "maintenanceMode": boolean,
        "message": string,
        "storeUrl": string
    }
}

Example Response:
{
    "valid": true,
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "mobile_number": "+918880920045",
        "email": "farmer@example.com",
        "name": "Farmer Name",
        "role": "FARMER",
        "status": "ACTIVE",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5,
        "total_completed_transactions": 10,
        "app_version": "1.0.0",
        "last_login_at": "2024-03-15T10:30:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-03-15T10:30:00Z"
    },
    "app_status": {
        "needsUpdate": false,
        "forceUpdate": false,
        "maintenanceMode": false,
        "message": null,
        "storeUrl": null
    }
}
```

## Profile

### Get Farmer Profile
```http
GET /farmers/profile
Authorization: Bearer {farmer_token}

Response:
{
    "id": string,
    "user_id": string,
    "created_at": string,
    "updated_at": string,
    "total_produce_count": number,
    "total_inspection_count": number,
    "total_transactions_completed_count": number,
    "farms": [
        {
            "id": string,
            "farmer_id": string,
            "name": string,
            "description": string,
            "size_in_acres": number,
            "address": string,
            "location": string, // format: "latitude,longitude"
            "image": string,
            "created_at": string,
            "updated_at": string
        }
    ],
    "bank_accounts": [
        {
            "id": string,
            "farmer_id": string,
            "account_name": string,
            "account_number": string,
            "bank_name": string,
            "branch_code": string,
            "is_primary": boolean,
            "created_at": string,
            "updated_at": string
        }
    ],
    "user": {
        "id": string,
        "name": string,
        "email": string,
        "mobile_number": string,
        "role": string,
        "status": string,
        "fcm_token": string,
        "avatar_url": string,
        "rating": number,
        "total_completed_transactions": number,
        "last_login_at": string,
        "app_version": string
    }
}
```

### Update Avatar
```http
POST /users/avatar
Authorization: Bearer {farmer_token}
Content-Type: multipart/form-data

Form Data:
- file: [Image File]
```

### Update User Details
```http
PATCH /farmers/profile/user-details
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "name": string,
    "email": string,
    "mobile_number": string,
    "avatar_url": string,
    "status": string,
    "fcm_token": string,
    "app_version": string // format: x.x.x
}

Response:
{
    // Same as Get Farmer Profile response
}
```

## Home

### Get Home Data
```http
GET /home/farmer?location=12.9716,77.5946
Authorization: Bearer {farmer_token}

Response:
{
    "market_trends": [
        {
            "produce_name": string,
            "daily_prices": [
                {
                    "date": string,
                    "timestamp": string,
                    "unix_timestamp": number,
                    "avg_price": number
                }
            ],
            "today": {
                "min_price": number,
                "max_price": number
            }
        }
    ],
    "active_offers": {
        "my_offers": [
            {
                "produce_id": string,
                "name": string,
                "quantity": number,
                "unit": string,
                "quality_grade": number,
                "distance_km": number,
                "is_manually_inspected": boolean,
                "produce_images": string[],
                "buyer": {
                    "id": string,
                    "name": string,
                    "avatar_url": string
                },
                "offer_price": number,
                "offer_status": string
            }
        ],
        "nearby_offers": [/* Same structure as my_offers */]
    },
    "recent_produces": [
        {
            "produce_id": string,
            "name": string,
            "quantity": number,
            "unit": string,
            "quality_grade": number,
            "distance_km": number,
            "is_manually_inspected": boolean,
            "produce_images": string[]
        }
    ],
    "top_buyers": [
        {
            "id": string,
            "name": string,
            "business_name": string,
            "avatar_url": string,
            "rating": number,
            "total_completed_transactions": number
        }
    ],
    "inspections": {
        "recent": [
            {
                "inspection_id": string,
                "produce_id": string,
                "produce_name": string,
                "produce_images": string[],
                "quality_assessment": any
            }
        ],
        "nearby": [/* Same structure as recent */]
    }
}
```

## Produce

### List Produce
```http
GET /produce?page=1&limit=10&sortBy=created_at&sortOrder=DESC
Authorization: Bearer {farmer_token}

Response:
{
    "items": [
        {
            "id": string,
            "farmer_id": string,
            "name": string,
            "description": string,
            "category": string,
            "variety": string,
            "quantity": number,
            "unit": string,
            "price": number,
            "location": {
                "type": string,
                "coordinates": [number, number]
            },
            "images": string[],
            "status": string,
            "created_at": string,
            "updated_at": string,
            "farmer": {
                "id": string,
                "name": string,
                "mobile_number": string,
                "avatar_url": string,
                "rating": number
            }
        }
    ],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
}

Example Response:
{
    "items": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Fresh Tomatoes",
            "description": "Organically grown fresh tomatoes",
            "category": "VEGETABLES",
            "variety": "Roma",
            "quantity": 100,
            "unit": "KG",
            "price": 40.00,
            "location": {
                "type": "Point",
                "coordinates": [77.5946, 12.9716]
            },
            "images": [
                "https://example.com/tomatoes1.jpg",
                "https://example.com/tomatoes2.jpg"
            ],
            "status": "ACTIVE",
            "created_at": "2024-03-15T08:00:00Z",
            "updated_at": "2024-03-15T08:00:00Z",
            "farmer": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Farmer Name",
                "mobile_number": "+918880920045",
                "avatar_url": "https://example.com/avatar.jpg",
                "rating": 4.5
            }
        }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
}
```

### Get Produce by ID
```http
GET /produce/{produce_id}
Authorization: Bearer {farmer_token}

Response:
{
    // Same structure as produce object in List Produce response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Fresh Tomatoes",
    "description": "Organically grown fresh tomatoes",
    "category": "VEGETABLES",
    "variety": "Roma",
    "quantity": 100,
    "unit": "KG",
    "price": 40.00,
    "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
    },
    "images": [
        "https://example.com/tomatoes1.jpg",
        "https://example.com/tomatoes2.jpg"
    ],
    "status": "ACTIVE",
    "created_at": "2024-03-15T08:00:00Z",
    "updated_at": "2024-03-15T08:00:00Z",
    "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Farmer Name",
        "mobile_number": "+918880920045",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5
    }
}
```

### Create Produce
```http
POST /produce
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "name": "Fresh Tomatoes",
    "description": "Organically grown fresh tomatoes",
    "category": "VEGETABLES",
    "variety": "Roma",
    "quantity": 100,
    "unit": "KG",
    "price": 40.00,
    "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
    },
    "images": ["https://example.com/tomatoes1.jpg", "https://example.com/tomatoes2.jpg"]
}

Response:
{
    // Same structure as Get Produce by ID response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Fresh Tomatoes",
    "description": "Organically grown fresh tomatoes",
    "category": "VEGETABLES",
    "variety": "Roma",
    "quantity": 100,
    "unit": "KG",
    "price": 40.00,
    "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
    },
    "images": [
        "https://example.com/tomatoes1.jpg",
        "https://example.com/tomatoes2.jpg"
    ],
    "status": "ACTIVE",
    "created_at": "2024-03-15T08:00:00Z",
    "updated_at": "2024-03-15T08:00:00Z",
    "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Farmer Name",
        "mobile_number": "+918880920045",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5
    }
}
```

### Update Produce
```http
PATCH /produce/{produce_id}
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "quantity": 80,
    "price": 45.00
}

Response:
{
    // Same structure as Get Produce by ID response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Fresh Tomatoes",
    "description": "Organically grown fresh tomatoes",
    "category": "VEGETABLES",
    "variety": "Roma",
    "quantity": 80,
    "unit": "KG",
    "price": 45.00,
    "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
    },
    "images": [
        "https://example.com/tomatoes1.jpg",
        "https://example.com/tomatoes2.jpg"
    ],
    "status": "ACTIVE",
    "created_at": "2024-03-15T08:00:00Z",
    "updated_at": "2024-03-15T08:30:00Z",
    "farmer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Farmer Name",
        "mobile_number": "+918880920045",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5
    }
}
```

### Delete Produce
```http
DELETE /produce/{produce_id}
Authorization: Bearer {farmer_token}

Response: No content (204)
```

## Inspections

### List Inspections
```http
GET /quality/inspections?page=1&limit=10&sortBy=status&sortOrder=ASC
Authorization: Bearer {farmer_token}

Response:
{
    "items": [
        {
            "id": string,
            "produce_id": string,
            "requester_id": string,
            "inspector_id": string,
            "location": {
                "type": string,
                "coordinates": [number, number]
            },
            "inspection_fee": number,
            "status": string,
            "scheduled_at": string,
            "assigned_at": string,
            "completed_at": string,
            "notes": string,
            "created_at": string,
            "updated_at": string,
            "produce": {
                "id": string,
                "name": string,
                "category": string,
                "variety": string,
                "images": string[]
            },
            "inspector": {
                "id": string,
                "name": string,
                "mobile_number": string,
                "avatar_url": string,
                "rating": number
            }
        }
    ],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
}

Example Response:
{
    "items": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "produce_id": "550e8400-e29b-41d4-a716-446655440001",
            "requester_id": "550e8400-e29b-41d4-a716-446655440000",
            "inspector_id": "550e8400-e29b-41d4-a716-446655440003",
            "location": {
                "type": "Point",
                "coordinates": [77.5946, 12.9716]
            },
            "inspection_fee": 500.00,
            "status": "SCHEDULED",
            "scheduled_at": "2024-03-16T10:00:00Z",
            "assigned_at": "2024-03-15T12:00:00Z",
            "completed_at": null,
            "notes": "Please inspect the tomatoes for quality grading",
            "created_at": "2024-03-15T11:00:00Z",
            "updated_at": "2024-03-15T12:00:00Z",
            "produce": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Fresh Tomatoes",
                "category": "VEGETABLES",
                "variety": "Roma",
                "images": [
                    "https://example.com/tomatoes1.jpg",
                    "https://example.com/tomatoes2.jpg"
                ]
            },
            "inspector": {
                "id": "550e8400-e29b-41d4-a716-446655440003",
                "name": "Inspector Name",
                "mobile_number": "+918880920046",
                "avatar_url": "https://example.com/inspector-avatar.jpg",
                "rating": 4.8
            }
        }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
}
```

### Get Quality Assessments by Produce ID
```http
GET /quality/assessments/by-produce/{produceId}
Authorization: Bearer {farmer_token}

Response:
[
    {
        "id": string,
        "produce_id": string,
        "produce_name": string,
        "category": string,
        "quality_grade": number,
        "confidence_level": number,
        "defects": string[],
        "recommendations": string[],
        "category_specific_assessment": {
            // Varies based on produce category
            "size": number,
            "color": string,
            "ripeness": number,
            "freshness": number,
            "cleanliness": number,
            "damage": number,
            "uniformity": number
        },
        "source": string,
        "inspector_id": string,
        "inspection_date": string,
        "inspection_request_id": string,
        "notes": string,
        "images": string[],
        "created_at": string,
        "updated_at": string
    }
]

Example Response:
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "produce_id": "550e8400-e29b-41d4-a716-446655440001",
        "produce_name": "Fresh Tomatoes",
        "category": "VEGETABLES",
        "quality_grade": 4.5,
        "confidence_level": 0.95,
        "defects": [
            "Minor color variations",
            "Few small blemishes"
        ],
        "recommendations": [
            "Store at room temperature",
            "Use within 7 days for best quality"
        ],
        "category_specific_assessment": {
            "size": 4.8,
            "color": "RED",
            "ripeness": 4.6,
            "freshness": 4.7,
            "cleanliness": 4.8,
            "damage": 4.5,
            "uniformity": 4.4
        },
        "source": "MANUAL_INSPECTION",
        "inspector_id": "550e8400-e29b-41d4-a716-446655440003",
        "inspection_date": "2024-03-16T10:30:00Z",
        "inspection_request_id": "550e8400-e29b-41d4-a716-446655440002",
        "notes": "Overall excellent quality with minor cosmetic issues",
        "images": [
            "https://example.com/inspection1.jpg",
            "https://example.com/inspection2.jpg"
        ],
        "created_at": "2024-03-16T10:30:00Z",
        "updated_at": "2024-03-16T10:30:00Z"
    }
]
```

### Request Inspection
```http
POST /quality/inspection/request
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "produce_id": string
}

Response:
{
    "id": string,
    "produce_id": string,
    "requester_id": string,
    "inspector_id": null,
    "status": "PENDING",
    "created_at": string,
    "updated_at": string
}
```

### Cancel Inspection
```http
POST /quality/inspections/cancel/{inspection_id}
Authorization: Bearer {farmer_token}
```

### Get Latest Inspection Request
```http
GET /quality/assessments/by-produce/{produceId}/latest
Authorization: Bearer {farmer_token}
```

## Offers

### List Offers
```http
GET /offers?page=1&limit=10&status=PENDING&sort[0][field]=price_per_unit&sort[0][order]=DESC
Authorization: Bearer {farmer_token}

Response:
{
    "items": [
        {
            "id": string,
            "produce_id": string,
            "buyer_id": string,
            "farmer_id": string,
            "price_per_unit": number,
            "quantity": number,
            "status": string,
            "valid_until": string,
            "is_auto_generated": boolean,
            "buyer_min_price": number,
            "buyer_max_price": number,
            "quality_grade": number,
            "distance_km": number,
            "inspection_fee": number,
            "rejection_reason": string,
            "cancellation_reason": string,
            "is_price_overridden": boolean,
            "price_override_reason": string,
            "price_override_at": string,
            "metadata": {
                "valid_until": string,
                "auto_generated": boolean,
                "ai_confidence": number,
                "inspection_fee_details": {
                    "base_fee": number,
                    "distance_fee": number,
                    "total_fee": number
                },
                "quality_assessment": {
                    "grade": number,
                    "defects": string[],
                    "recommendations": string[]
                },
                "price_history": [
                    {
                        "price": number,
                        "timestamp": string,
                        "reason": string
                    }
                ]
            },
            "created_at": string,
            "updated_at": string,
            "produce": {
                // Produce object (same as Get Produce response)
            },
            "buyer": {
                "id": string,
                "business_name": string,
                "address": string,
                "location": string,
                "name": string,
                "avatar_url": string,
                "rating": number,
                "total_completed_transactions": number
            }
        }
    ],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
}
```

### Get Offer Details
```http
GET /offers/details/{id}
Authorization: Bearer {farmer_token}

Response:
{
    // Same as single offer object in List Offers response
}
```

### Accept Offer
```http
POST /offers/farmer/accept/{id}
Authorization: Bearer {farmer_token}

Response:
{
    // Same as single offer object in List Offers response
}
```

### Reject Offer
```http
POST /offers/farmer/reject/{id}
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "reason": string
}

Response:
{
    // Same as single offer object in List Offers response
}
```

### Get Offer Stats
```http
GET /offers/stats
Authorization: Bearer {farmer_token}

Response:
{
    "total": number,
    "pending": number,
    "accepted": number,
    "rejected": number,
    "cancelled": number
}
```

## Transactions

### List Transactions
```http
GET /transactions?page=1&limit=10&role=FARMER
Authorization: Bearer {farmer_token}

Response:
{
    "items": [
        {
            "id": string,
            "offer_id": string,
            "produce_id": string,
            "buyer_id": string,
            "farmer_id": string,
            "final_price": number,
            "final_quantity": number,
            "status": string,
            "delivery_window_starts_at": string,
            "delivery_window_ends_at": string,
            "delivery_confirmed_at": string,
            "buyer_inspection_completed_at": string,
            "distance_km": number,
            "created_at": string,
            "updated_at": string,
            "requires_rating": boolean,
            "rating_completed": boolean,
            "produce": {
                "id": string,
                "name": string,
                "category": string,
                "variety": string,
                "images": string[]
            },
            "buyer": {
                "id": string,
                "name": string,
                "mobile_number": string,
                "avatar_url": string,
                "rating": number
            }
        }
    ],
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
}

Example Response:
{
    "items": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440005",
            "offer_id": "550e8400-e29b-41d4-a716-446655440006",
            "produce_id": "550e8400-e29b-41d4-a716-446655440001",
            "buyer_id": "550e8400-e29b-41d4-a716-446655440007",
            "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
            "final_price": 40.00,
            "final_quantity": 50,
            "status": "DELIVERY_CONFIRMED",
            "delivery_window_starts_at": "2024-03-17T09:00:00Z",
            "delivery_window_ends_at": "2024-03-17T17:00:00Z",
            "delivery_confirmed_at": "2024-03-17T14:30:00Z",
            "buyer_inspection_completed_at": "2024-03-17T14:45:00Z",
            "distance_km": 5.2,
            "created_at": "2024-03-16T12:00:00Z",
            "updated_at": "2024-03-17T14:45:00Z",
            "requires_rating": true,
            "rating_completed": false,
            "produce": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Fresh Tomatoes",
                "category": "VEGETABLES",
                "variety": "Roma",
                "images": [
                    "https://example.com/tomatoes1.jpg",
                    "https://example.com/tomatoes2.jpg"
                ]
            },
            "buyer": {
                "id": "550e8400-e29b-41d4-a716-446655440007",
                "name": "Buyer Name",
                "mobile_number": "+918880920047",
                "avatar_url": "https://example.com/buyer-avatar.jpg",
                "rating": 4.7
            }
        }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
}
```

### Get Transaction
```http
GET /transactions/{transaction_id}
Authorization: Bearer {farmer_token}

Response:
{
    // Same structure as transaction object in List Transactions response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "offer_id": "550e8400-e29b-41d4-a716-446655440006",
    "produce_id": "550e8400-e29b-41d4-a716-446655440001",
    "buyer_id": "550e8400-e29b-41d4-a716-446655440007",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "final_price": 40.00,
    "final_quantity": 50,
    "status": "DELIVERY_CONFIRMED",
    "delivery_window_starts_at": "2024-03-17T09:00:00Z",
    "delivery_window_ends_at": "2024-03-17T17:00:00Z",
    "delivery_confirmed_at": "2024-03-17T14:30:00Z",
    "buyer_inspection_completed_at": "2024-03-17T14:45:00Z",
    "distance_km": 5.2,
    "created_at": "2024-03-16T12:00:00Z",
    "updated_at": "2024-03-17T14:45:00Z",
    "requires_rating": true,
    "rating_completed": false,
    "produce": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Fresh Tomatoes",
        "category": "VEGETABLES",
        "variety": "Roma",
        "images": [
            "https://example.com/tomatoes1.jpg",
            "https://example.com/tomatoes2.jpg"
        ]
    },
    "buyer": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "Buyer Name",
        "mobile_number": "+918880920047",
        "avatar_url": "https://example.com/buyer-avatar.jpg",
        "rating": 4.7
    }
}
```

### Start Delivery
```http
POST /transactions/{transaction_id}/start-delivery
Authorization: Bearer {farmer_token}

Response:
{
    // Same structure as Get Transaction response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "offer_id": "550e8400-e29b-41d4-a716-446655440006",
    "produce_id": "550e8400-e29b-41d4-a716-446655440001",
    "buyer_id": "550e8400-e29b-41d4-a716-446655440007",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "final_price": 40.00,
    "final_quantity": 50,
    "status": "DELIVERY_STARTED",
    "delivery_window_starts_at": "2024-03-17T09:00:00Z",
    "delivery_window_ends_at": "2024-03-17T17:00:00Z",
    "delivery_confirmed_at": null,
    "buyer_inspection_completed_at": null,
    "distance_km": 5.2,
    "created_at": "2024-03-16T12:00:00Z",
    "updated_at": "2024-03-17T09:15:00Z",
    "requires_rating": false,
    "rating_completed": false,
    "produce": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Fresh Tomatoes",
        "category": "VEGETABLES",
        "variety": "Roma",
        "images": [
            "https://example.com/tomatoes1.jpg",
            "https://example.com/tomatoes2.jpg"
        ]
    },
    "buyer": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "Buyer Name",
        "mobile_number": "+918880920047",
        "avatar_url": "https://example.com/buyer-avatar.jpg",
        "rating": 4.7
    }
}
```

### Cancel Transaction
```http
POST /transactions/{transaction_id}/cancel
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "reason": "Unable to deliver within the specified time window"
}

Response:
{
    // Same structure as Get Transaction response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "offer_id": "550e8400-e29b-41d4-a716-446655440006",
    "produce_id": "550e8400-e29b-41d4-a716-446655440001",
    "buyer_id": "550e8400-e29b-41d4-a716-446655440007",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "final_price": 40.00,
    "final_quantity": 50,
    "status": "CANCELLED",
    "delivery_window_starts_at": "2024-03-17T09:00:00Z",
    "delivery_window_ends_at": "2024-03-17T17:00:00Z",
    "delivery_confirmed_at": null,
    "buyer_inspection_completed_at": null,
    "distance_km": 5.2,
    "created_at": "2024-03-16T12:00:00Z",
    "updated_at": "2024-03-17T08:30:00Z",
    "requires_rating": false,
    "rating_completed": false,
    "produce": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Fresh Tomatoes",
        "category": "VEGETABLES",
        "variety": "Roma",
        "images": [
            "https://example.com/tomatoes1.jpg",
            "https://example.com/tomatoes2.jpg"
        ]
    },
    "buyer": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "Buyer Name",
        "mobile_number": "+918880920047",
        "avatar_url": "https://example.com/buyer-avatar.jpg",
        "rating": 4.7
    }
}
```

### Reactivate Transaction
```http
POST /transactions/reactivate/{transaction_id}
Authorization: Bearer {farmer_token}

Response:
{
    // Same structure as Get Transaction response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "offer_id": "550e8400-e29b-41d4-a716-446655440006",
    "produce_id": "550e8400-e29b-41d4-a716-446655440001",
    "buyer_id": "550e8400-e29b-41d4-a716-446655440007",
    "farmer_id": "550e8400-e29b-41d4-a716-446655440000",
    "final_price": 40.00,
    "final_quantity": 50,
    "status": "ACCEPTED",
    "delivery_window_starts_at": "2024-03-17T09:00:00Z",
    "delivery_window_ends_at": "2024-03-17T17:00:00Z",
    "delivery_confirmed_at": null,
    "buyer_inspection_completed_at": null,
    "distance_km": 5.2,
    "created_at": "2024-03-16T12:00:00Z",
    "updated_at": "2024-03-17T08:45:00Z",
    "requires_rating": false,
    "rating_completed": false,
    "produce": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Fresh Tomatoes",
        "category": "VEGETABLES",
        "variety": "Roma",
        "images": [
            "https://example.com/tomatoes1.jpg",
            "https://example.com/tomatoes2.jpg"
        ]
    },
    "buyer": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "Buyer Name",
        "mobile_number": "+918880920047",
        "avatar_url": "https://example.com/buyer-avatar.jpg",
        "rating": 4.7
    }
}
```

## Ratings

### Create Rating
```http
POST /ratings
Authorization: Bearer {farmer_token}
Content-Type: application/json

{
    "transaction_id": "550e8400-e29b-41d4-a716-446655440005",
    "rating": 4,
    "review": "Great buyer, smooth transaction",
    "rating_type": "FARMER_TO_BUYER"
}

Response:
{
    "id": string,
    "transaction_id": string,
    "rating_user_id": string,
    "rated_user_id": string,
    "rating": number,
    "review": string,
    "created_at": string,
    "updated_at": string,
    "rating_user": {
        "id": string,
        "name": string,
        "mobile_number": string,
        "avatar_url": string,
        "rating": number
    },
    "rated_user": {
        "id": string,
        "name": string,
        "mobile_number": string,
        "avatar_url": string,
        "rating": number
    },
    "transaction": {
        // Same structure as transaction object in List Transactions response
    }
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440008",
    "transaction_id": "550e8400-e29b-41d4-a716-446655440005",
    "rating_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "rated_user_id": "550e8400-e29b-41d4-a716-446655440007",
    "rating": 4,
    "review": "Great buyer, smooth transaction",
    "created_at": "2024-03-17T15:00:00Z",
    "updated_at": "2024-03-17T15:00:00Z",
    "rating_user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Farmer Name",
        "mobile_number": "+918880920045",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5
    },
    "rated_user": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "Buyer Name",
        "mobile_number": "+918880920047",
        "avatar_url": "https://example.com/buyer-avatar.jpg",
        "rating": 4.7
    },
    "transaction": {
        // Same structure as transaction object in Create Rating response
    }
}
```

### Get Received Ratings
```http
GET /ratings/received
Authorization: Bearer {farmer_token}

Response:
[
    // Array of rating objects (same structure as Create Rating response)
]

Example Response:
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440009",
        "transaction_id": "550e8400-e29b-41d4-a716-446655440010",
        "rating_user_id": "550e8400-e29b-41d4-a716-446655440007",
        "rated_user_id": "550e8400-e29b-41d4-a716-446655440000",
        "rating": 5,
        "review": "Excellent produce quality and timely delivery",
        "created_at": "2024-03-15T16:00:00Z",
        "updated_at": "2024-03-15T16:00:00Z",
        "rating_user": {
            "id": "550e8400-e29b-41d4-a716-446655440007",
            "name": "Buyer Name",
            "mobile_number": "+918880920047",
            "avatar_url": "https://example.com/buyer-avatar.jpg",
            "rating": 4.7
        },
        "rated_user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Farmer Name",
            "mobile_number": "+918880920045",
            "avatar_url": "https://example.com/avatar.jpg",
            "rating": 4.5
        },
        "transaction": {
            // Same structure as transaction object in Create Rating response
        }
    }
]
```

### Get Given Ratings
```http
GET /ratings/given
Authorization: Bearer {farmer_token}

Response:
[
    // Array of rating objects (same structure as Create Rating response)
]

Example Response:
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "transaction_id": "550e8400-e29b-41d4-a716-446655440005",
        "rating_user_id": "550e8400-e29b-41d4-a716-446655440000",
        "rated_user_id": "550e8400-e29b-41d4-a716-446655440007",
        "rating": 4,
        "review": "Great buyer, smooth transaction",
        "created_at": "2024-03-17T15:00:00Z",
        "updated_at": "2024-03-17T15:00:00Z",
        "rating_user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Farmer Name",
            "mobile_number": "+918880920045",
            "avatar_url": "https://example.com/avatar.jpg",
            "rating": 4.5
        },
        "rated_user": {
            "id": "550e8400-e29b-41d4-a716-446655440007",
            "name": "Buyer Name",
            "mobile_number": "+918880920047",
            "avatar_url": "https://example.com/buyer-avatar.jpg",
            "rating": 4.7
        },
        "transaction": {
            // Same structure as transaction object in Create Rating response
        }
    }
]
```

### Get Rating
```http
GET /ratings/{rating_id}
Authorization: Bearer {farmer_token}

Response:
{
    // Same structure as Create Rating response
}

Example Response:
{
    "id": "550e8400-e29b-41d4-a716-446655440008",
    "transaction_id": "550e8400-e29b-41d4-a716-446655440005",
    "rating_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "rated_user_id": "550e8400-e29b-41d4-a716-446655440007",
    "rating": 4,
    "review": "Great buyer, smooth transaction",
    "created_at": "2024-03-17T15:00:00Z",
    "updated_at": "2024-03-17T15:00:00Z",
    "rating_user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Farmer Name",
        "mobile_number": "+918880920045",
        "avatar_url": "https://example.com/avatar.jpg",
        "rating": 4.5
    },
    "rated_user": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "name": "Buyer Name",
        "mobile_number": "+918880920047",
        "avatar_url": "https://example.com/buyer-avatar.jpg",
        "rating": 4.7
    },
    "transaction": {
        // Same structure as transaction object in Create Rating response
    }
}
```

### Get Transaction Ratings
```http
GET /ratings/transaction/{transaction_id}
Authorization: Bearer {farmer_token}

Response:
[
    // Array of rating objects (same structure as Create Rating response)
]

Example Response:
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440008",
        "transaction_id": "550e8400-e29b-41d4-a716-446655440005",
        "rating_user_id": "550e8400-e29b-41d4-a716-446655440000",
        "rated_user_id": "550e8400-e29b-41d4-a716-446655440007",
        "rating": 4,
        "review": "Great buyer, smooth transaction",
        "created_at": "2024-03-17T15:00:00Z",
        "updated_at": "2024-03-17T15:00:00Z",
        "rating_user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Farmer Name",
            "mobile_number": "+918880920045",
            "avatar_url": "https://example.com/avatar.jpg",
            "rating": 4.5
        },
        "rated_user": {
            "id": "550e8400-e29b-41d4-a716-446655440007",
            "name": "Buyer Name",
            "mobile_number": "+918880920047",
            "avatar_url": "https://example.com/buyer-avatar.jpg",
            "rating": 4.7
        },
        "transaction": {
            // Same structure as transaction object in Create Rating response
        }
    }
]
```

### Delete Rating
```http
DELETE /ratings/{rating_id}
Authorization: Bearer {farmer_token}

Response: No content (204)
```