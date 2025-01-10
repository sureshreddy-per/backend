# Inspection API Documentation

This document outlines the API endpoints related to inspections and inspection fees in the agricultural marketplace.

## Table of Contents
- [Inspection Endpoints](#inspection-endpoints)
  - [Request Inspection](#request-inspection)
  - [Get Inspections by Produce](#get-inspections-by-produce)
  - [Get Inspections by Requester](#get-inspections-by-requester)
  - [Get Inspections by Inspector](#get-inspections-by-inspector)
  - [Assign Inspector](#assign-inspector)
- [Inspection Fees Endpoints](#inspection-fees-endpoints)
  - [Update Base Fee](#update-base-fee)
  - [Update Distance Fee](#update-distance-fee)

## Inspection Endpoints

### Request Inspection

Creates a new inspection request for a produce listing.

**Endpoint:** `POST /inspections/request`

**Requirements:**
- User must be authenticated
- User must be a FARMER
- Produce must exist and belong to the requesting farmer

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "produce_id": "uuid-of-produce"
}
```

**Success Response (201 Created):**
```json
{
    "id": "uuid-of-inspection",
    "produce_id": "uuid-of-produce",
    "requester_id": "uuid-of-farmer",
    "inspector_id": null,
    "status": "PENDING",
    "requested_at": "2024-01-09T12:00:00Z",
    "completed_at": null,
    "inspection_fee": {
        "base_fee": 50.00,
        "distance_fee": 2.50,
        "total_fee": 52.50
    }
}
```

### Get Inspections by Produce

Retrieves all inspections for a specific produce listing.

**Endpoint:** `GET /inspections/by-produce/:produce_id`

**Requirements:**
- User must be authenticated
- User must be either the FARMER who owns the produce or an INSPECTOR

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
    "inspections": [
        {
            "id": "uuid-of-inspection",
            "produce_id": "uuid-of-produce",
            "requester_id": "uuid-of-farmer",
            "inspector_id": "uuid-of-inspector",
            "status": "COMPLETED",
            "requested_at": "2024-01-09T12:00:00Z",
            "completed_at": "2024-01-09T14:00:00Z",
            "inspection_fee": {
                "base_fee": 50.00,
                "distance_fee": 2.50,
                "total_fee": 52.50
            }
        }
    ]
}
```

### Get Inspections by Requester

Retrieves all inspections requested by the authenticated farmer.

**Endpoint:** `GET /inspections/by-requester`

**Requirements:**
- User must be authenticated
- User must be a FARMER

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
    "inspections": [
        {
            "id": "uuid-of-inspection",
            "produce_id": "uuid-of-produce",
            "produce_name": "Test Produce",
            "requester_id": "uuid-of-farmer",
            "inspector_id": "uuid-of-inspector",
            "status": "PENDING",
            "requested_at": "2024-01-09T12:00:00Z",
            "completed_at": null,
            "inspection_fee": {
                "base_fee": 50.00,
                "distance_fee": 2.50,
                "total_fee": 52.50
            }
        }
    ]
}
```

### Get Inspections by Inspector

Retrieves all inspections assigned to the authenticated inspector.

**Endpoint:** `GET /inspections/by-inspector`

**Requirements:**
- User must be authenticated
- User must be an INSPECTOR

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
    "inspections": [
        {
            "id": "uuid-of-inspection",
            "produce_id": "uuid-of-produce",
            "produce_name": "Test Produce",
            "requester_id": "uuid-of-farmer",
            "inspector_id": "uuid-of-inspector",
            "status": "IN_PROGRESS",
            "requested_at": "2024-01-09T12:00:00Z",
            "completed_at": null,
            "inspection_fee": {
                "base_fee": 50.00,
                "distance_fee": 2.50,
                "total_fee": 52.50
            }
        }
    ]
}
```

### Assign Inspector

Assigns an inspector to a pending inspection request.

**Endpoint:** `PUT /inspections/:id/assign`

**Requirements:**
- User must be authenticated
- User must be an ADMIN
- Inspection must be in PENDING status
- Inspector must be available and have INSPECTOR role

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "inspector_id": "uuid-of-inspector"
}
```

**Success Response (200 OK):**
```json
{
    "id": "uuid-of-inspection",
    "produce_id": "uuid-of-produce",
    "requester_id": "uuid-of-farmer",
    "inspector_id": "uuid-of-inspector",
    "status": "ASSIGNED",
    "requested_at": "2024-01-09T12:00:00Z",
    "completed_at": null,
    "inspection_fee": {
        "base_fee": 50.00,
        "distance_fee": 2.50,
        "total_fee": 52.50
    }
}
```

## Inspection Fees Endpoints

### Update Base Fee

Updates the base fee for inspections based on produce category.

**Endpoint:** `PUT /inspection-fees/base-fee`

**Requirements:**
- User must be authenticated
- User must be an ADMIN

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "produce_category": "VEGETABLES",
    "base_fee": 50.00
}
```

**Success Response (200 OK):**
```json
{
    "id": "uuid-of-fee-config",
    "produce_category": "VEGETABLES",
    "base_fee": 50.00,
    "updated_at": "2024-01-09T12:00:00Z",
    "updated_by": "uuid-of-admin"
}
```

### Update Distance Fee

Updates the distance-based fee configuration for inspections.

**Endpoint:** `PUT /inspection-fees/distance-fee`

**Requirements:**
- User must be authenticated
- User must be an ADMIN

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "min_distance": 0,
    "max_distance": 50,
    "fee": 2.50
}
```

**Success Response (200 OK):**
```json
{
    "id": "uuid-of-fee-config",
    "min_distance": 0,
    "max_distance": 50,
    "fee": 2.50,
    "updated_at": "2024-01-09T12:00:00Z",
    "updated_by": "uuid-of-admin"
}
```

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
    "statusCode": 403,
    "message": "Forbidden",
    "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
    "statusCode": 404,
    "message": "Not Found",
    "error": "Resource not found"
}
```

**400 Bad Request:**
```json
{
    "statusCode": 400,
    "message": "Bad Request",
    "error": "Invalid request parameters"
} 