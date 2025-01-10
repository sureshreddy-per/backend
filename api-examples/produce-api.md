# Produce API Documentation

This document outlines the available endpoints for managing produce listings in the agricultural marketplace.

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Content Type

For endpoints that accept request bodies, use:
```
Content-Type: application/json
```

## Endpoints

### Create Produce Listing

Create a new produce listing in the marketplace.

**Endpoint:** `POST /produce`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Fresh Tomatoes",
  "description": "Organic farm-fresh tomatoes",
  "produce_category": "Vegetables",
  "quantity": 100,
  "unit": "kg",
  "price_per_unit": 2.50,
  "location": "37.7749,-122.4194",
  "quality_grade": 10,
  "harvested_at": "2024-01-20T00:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "04db2931-990b-4817-91c7-c1664bad3569",
  "farmer_id": "4d3dc676-a375-49cc-ac5d-a93d3c6c3c91",
  "farm_id": null,
  "name": "Fresh Tomatoes",
  "description": "Organic farm-fresh tomatoes",
  "product_variety": null,
  "produce_category": "Vegetables",
  "quantity": "100",
  "unit": "kg",
  "price_per_unit": "2.50",
  "location": "37.7749,-122.4194",
  "location_name": null,
  "inspection_fee": null,
  "is_inspection_requested": false,
  "inspection_requested_by": null,
  "inspection_requested_at": null,
  "images": null,
  "status": "AVAILABLE",
  "harvested_at": "2024-01-20T00:00:00.000Z",
  "expiry_date": null,
  "quality_grade": 10,
  "video_url": null,
  "assigned_inspector": null,
  "created_at": "2025-01-09T15:38:00.516Z",
  "updated_at": "2025-01-09T15:38:00.516Z"
}
```

### Get All Produce

Retrieve a paginated list of produce with optional filters.

**Endpoint:** `GET /produce`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `produce_category`: Filter by produce category (optional)
- `status`: Filter by status (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example Request:**
```
GET /produce?produce_category=Vegetables&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "04db2931-990b-4817-91c7-c1664bad3569",
      "farmer_id": "4d3dc676-a375-49cc-ac5d-a93d3c6c3c91",
      "farm_id": null,
      "name": "Fresh Tomatoes",
      "description": "Organic farm-fresh tomatoes",
      "product_variety": null,
      "produce_category": "Vegetables",
      "quantity": "100",
      "unit": "kg",
      "price_per_unit": "2.50",
      "location": "37.7749,-122.4194",
      "location_name": null,
      "inspection_fee": null,
      "is_inspection_requested": false,
      "inspection_requested_by": null,
      "inspection_requested_at": null,
      "images": null,
      "status": "AVAILABLE",
      "harvested_at": "2024-01-20T00:00:00.000Z",
      "expiry_date": null,
      "quality_grade": 10,
      "video_url": null,
      "assigned_inspector": null,
      "created_at": "2025-01-09T15:38:00.516Z",
      "updated_at": "2025-01-09T15:38:00.516Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Find Nearby Produce

Find produce listings within a specified radius of given coordinates.

**Endpoint:** `GET /produce/nearby`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `lat`: Latitude (required)
- `lon`: Longitude (required)
- `radius`: Search radius in kilometers (default: 10)

**Example Request:**
```
GET /produce/nearby?lat=37.7749&lon=-122.4194&radius=10
```

**Response:** `200 OK`
```json
[
  {
    "id": "c06af446-925f-462e-8171-50003bda67bb",
    "farmer_id": "4d3dc676-a375-49cc-ac5d-a93d3c6c3c91",
    "farm_id": null,
    "name": "Fresh Apples",
    "description": "Local organic apples",
    "product_variety": null,
    "produce_category": "Fruits",
    "quantity": "50",
    "unit": "kg",
    "price_per_unit": "4.00",
    "location": "37.7750,-122.4183",
    "location_name": null,
    "inspection_fee": null,
    "is_inspection_requested": false,
    "inspection_requested_by": null,
    "inspection_requested_at": null,
    "images": null,
    "status": "AVAILABLE",
    "harvested_at": "2024-01-20T00:00:00.000Z",
    "expiry_date": null,
    "quality_grade": 9,
    "video_url": null,
    "assigned_inspector": null,
    "created_at": "2025-01-09T15:40:30.367Z",
    "updated_at": "2025-01-09T15:40:30.367Z"
  }
]
```

### Get Produce by ID

Retrieve a specific produce listing by its ID.

**Endpoint:** `GET /produce/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Example Request:**
```
GET /produce/04db2931-990b-4817-91c7-c1664bad3569
```

**Response:** `200 OK`
```json
{
  "id": "04db2931-990b-4817-91c7-c1664bad3569",
  "farmer_id": "4d3dc676-a375-49cc-ac5d-a93d3c6c3c91",
  "farm_id": null,
  "name": "Fresh Tomatoes",
  "description": "Organic farm-fresh tomatoes",
  "product_variety": null,
  "produce_category": "Vegetables",
  "quantity": "100",
  "unit": "kg",
  "price_per_unit": "2.50",
  "location": "37.7749,-122.4194",
  "location_name": null,
  "inspection_fee": null,
  "is_inspection_requested": false,
  "inspection_requested_by": null,
  "inspection_requested_at": null,
  "images": null,
  "status": "AVAILABLE",
  "harvested_at": "2024-01-20T00:00:00.000Z",
  "expiry_date": null,
  "quality_grade": 10,
  "video_url": null,
  "assigned_inspector": null,
  "created_at": "2025-01-09T15:38:00.516Z",
  "updated_at": "2025-01-09T15:38:00.516Z"
}
```

### Update Produce

Update an existing produce listing.

**Endpoint:** `PATCH /produce/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "price_per_unit": 3.00,
  "quantity": 80
}
```

**Response:** `200 OK`
```json
{
  "id": "04db2931-990b-4817-91c7-c1664bad3569",
  "farmer_id": "4d3dc676-a375-49cc-ac5d-a93d3c6c3c91",
  "farm_id": null,
  "name": "Fresh Tomatoes",
  "description": "Organic farm-fresh tomatoes",
  "product_variety": null,
  "produce_category": "Vegetables",
  "quantity": "80",
  "unit": "kg",
  "price_per_unit": "3.00",
  "location": "37.7749,-122.4194",
  "location_name": null,
  "inspection_fee": null,
  "is_inspection_requested": false,
  "inspection_requested_by": null,
  "inspection_requested_at": null,
  "images": null,
  "status": "AVAILABLE",
  "harvested_at": "2024-01-20T00:00:00.000Z",
  "expiry_date": null,
  "quality_grade": 10,
  "video_url": null,
  "assigned_inspector": null,
  "created_at": "2025-01-09T15:38:00.516Z",
  "updated_at": "2025-01-09T15:38:25.885Z"
}
```

### Delete Produce

Delete a produce listing.

**Endpoint:** `DELETE /produce/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Example Request:**
```
DELETE /produce/04db2931-990b-4817-91c7-c1664bad3569
```

**Response:** `204 No Content`

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Invalid token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 404 Not Found
```json
{
  "message": "Produce with ID {id} not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 400 Bad Request
```json
{
  "message": ["quality_grade must be one of the following values: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1"],
  "error": "Bad Request",
  "statusCode": 400
}
``` 