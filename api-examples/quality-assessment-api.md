# Quality Assessment API Documentation

This document outlines the API endpoints for managing quality assessments of produce items.

## Create AI Assessment

Create a new AI-generated quality assessment for a produce item.

**Endpoint:** `POST /quality/ai-assessment`  
**Access:** Admin only

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
  "quality_grade": 8,
  "confidence_level": 85,
  "defects": ["minor_bruising"],
  "recommendations": ["Store in cool temperature"],
  "description": "Good quality produce with minor issues",
  "category_specific_assessment": {
    "freshness": "good",
    "color_uniformity": 90
  }
}
```

### Response (200 OK)
```json
{
  "id": "cc2e3180-fc91-4f9e-a6f6-2c781bc1de22",
  "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
  "source": "AI",
  "quality_grade": 8,
  "confidence_level": 85,
  "defects": ["minor_bruising"],
  "recommendations": ["Store in cool temperature"],
  "description": "Good quality produce with minor issues",
  "category_specific_assessment": {
    "freshness": "good",
    "color_uniformity": 90
  },
  "metadata": null,
  "created_at": "2025-01-09T16:35:12.181Z",
  "updated_at": "2025-01-09T16:35:12.181Z"
}
```

## Create Inspection Assessment

Create a new manual inspection assessment for a produce item.

**Endpoint:** `POST /quality/inspection`  
**Access:** Inspector only

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
  "quality_grade": 7,
  "defects": ["slight_discoloration"],
  "recommendations": ["Improve packaging"],
  "description": "Manual inspection complete",
  "images": ["http://example.com/image1.jpg"],
  "inspector_id": "0bc1cc85-fb71-4608-b4bf-c91bebd705d1"
}
```

### Response (200 OK)
```json
{
  "id": "86f11ff5-0245-4de4-a8a4-cbc37a74cf95",
  "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
  "source": "MANUAL_INSPECTION",
  "quality_grade": 7,
  "confidence_level": 100,
  "defects": ["slight_discoloration"],
  "recommendations": ["Improve packaging"],
  "description": "Manual inspection complete",
  "category_specific_assessment": null,
  "metadata": {
    "images": ["http://example.com/image1.jpg"],
    "inspector_id": "0bc1cc85-fb71-4608-b4bf-c91bebd705d1"
  },
  "created_at": "2025-01-09T16:37:24.181Z",
  "updated_at": "2025-01-09T16:37:24.181Z"
}
```

## Get Assessments by Produce

Retrieve all quality assessments for a specific produce item.

**Endpoint:** `GET /quality/produce/:produce_id`  
**Access:** Authenticated users

### Headers
```
Authorization: Bearer <jwt_token>
```

### Response (200 OK)
```json
[
  {
    "id": "86f11ff5-0245-4de4-a8a4-cbc37a74cf95",
    "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
    "source": "MANUAL_INSPECTION",
    "quality_grade": 7,
    "confidence_level": 100,
    "defects": ["slight_discoloration"],
    "recommendations": ["Improve packaging"],
    "description": "Manual inspection complete",
    "category_specific_assessment": null,
    "metadata": {
      "images": ["http://example.com/image1.jpg"],
      "inspector_id": "0bc1cc85-fb71-4608-b4bf-c91bebd705d1"
    },
    "created_at": "2025-01-09T16:37:24.181Z",
    "updated_at": "2025-01-09T16:37:24.181Z"
  },
  {
    "id": "cc2e3180-fc91-4f9e-a6f6-2c781bc1de22",
    "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
    "source": "AI",
    "quality_grade": 8,
    "confidence_level": 85,
    "defects": ["minor_bruising"],
    "recommendations": ["Store in cool temperature"],
    "description": "Good quality produce with minor issues",
    "category_specific_assessment": {
      "freshness": "good",
      "color_uniformity": 90
    },
    "metadata": null,
    "created_at": "2025-01-09T16:35:12.181Z",
    "updated_at": "2025-01-09T16:35:12.181Z"
  }
]
```

## Get Latest Assessment

Retrieve the most recent quality assessment for a specific produce item.

**Endpoint:** `GET /quality/produce/:produce_id/latest`  
**Access:** Authenticated users

### Headers
```
Authorization: Bearer <jwt_token>
```

### Response (200 OK)
```json
{
  "id": "86f11ff5-0245-4de4-a8a4-cbc37a74cf95",
  "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
  "source": "MANUAL_INSPECTION",
  "quality_grade": 7,
  "confidence_level": 100,
  "defects": ["slight_discoloration"],
  "recommendations": ["Improve packaging"],
  "description": "Manual inspection complete",
  "category_specific_assessment": null,
  "metadata": {
    "images": ["http://example.com/image1.jpg"],
    "inspector_id": "0bc1cc85-fb71-4608-b4bf-c91bebd705d1"
  },
  "created_at": "2025-01-09T16:37:24.181Z",
  "updated_at": "2025-01-09T16:37:24.181Z"
}
```

## Get Latest Manual Assessment

Retrieve the most recent manual inspection assessment for a specific produce item.

**Endpoint:** `GET /quality/produce/:produce_id/latest-manual`  
**Access:** Authenticated users

### Headers
```
Authorization: Bearer <jwt_token>
```

### Response (200 OK)
```json
{
  "id": "86f11ff5-0245-4de4-a8a4-cbc37a74cf95",
  "produce_id": "960015df-7e26-434f-a1a1-38403a78b841",
  "source": "MANUAL_INSPECTION",
  "quality_grade": 7,
  "confidence_level": 100,
  "defects": ["slight_discoloration"],
  "recommendations": ["Improve packaging"],
  "description": "Manual inspection complete",
  "category_specific_assessment": null,
  "metadata": {
    "images": ["http://example.com/image1.jpg"],
    "inspector_id": "0bc1cc85-fb71-4608-b4bf-c91bebd705d1"
  },
  "created_at": "2025-01-09T16:37:24.181Z",
  "updated_at": "2025-01-09T16:37:24.181Z"
}
``` 