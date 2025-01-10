# Produce Synonyms API Documentation

This document outlines the API endpoints for managing produce synonyms in the system.

## Authentication

All endpoints require JWT authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Content Type

All requests and responses use JSON:
```
Content-Type: application/json
```

## Endpoints

### Add New Synonyms

Add new synonyms for a produce name. Requires ADMIN role.

**Endpoint:** `POST /produce-synonyms`

**Request Body:**
```json
{
  "canonical_name": "tomato",
  "words": ["tomatoes", "roma tomato", "cherry tomato"],
  "translations": {
    "es": "tomate",
    "fr": "tomate"
  }
}
```

**Response:** (201 Created)
```json
{
  "id": "d54700fa-7ac2-4ded-b277-c29694a0c2f7",
  "canonical_name": "tomato",
  "words": ["tomatoes", "roma tomato", "cherry tomato"],
  "translations": {
    "es": "tomate",
    "fr": "tomate"
  },
  "is_active": true,
  "updated_by": "68ad7c66-6bbd-4a1b-b402-5861981c6ae5",
  "created_at": "2025-01-09T15:56:14.378Z",
  "updated_at": "2025-01-09T15:56:14.378Z"
}
```

### Search Synonyms

Search for produce synonyms based on a query string. The search looks through canonical names, words, and translations.

**Endpoint:** `GET /produce-synonyms/search?query=tom`

**Response:** (200 OK)
```json
[
  "tomato"
]
```

### Find Canonical Name

Find the canonical name for a given word or translation.

**Endpoint:** `GET /produce-synonyms/canonical?word=tomatoes`

**Response:** (200 OK)
```json
"tomato"
```

### Deactivate Synonym

Deactivate a synonym entry by its canonical name. Requires ADMIN role.

**Endpoint:** `DELETE /produce-synonyms/:canonicalName`

Example: `DELETE /produce-synonyms/tomato`

**Response:** (200 OK)
```json
{
  "message": "Synonym deactivated successfully"
}
```

## Error Responses

### Unauthorized Access
```json
{
  "message": "Invalid token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Forbidden Access
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Not Found
```json
{
  "message": "Synonym not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Bad Request
```json
{
  "message": "Invalid request body",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Notes

1. The `canonical_name` is the standardized name for a produce item.
2. `words` array contains alternative names and common variations.
3. `translations` object contains translations in different languages.
4. Deactivated synonyms won't appear in search results.
5. All authenticated users can search synonyms and find canonical names.
6. Only users with ADMIN role can add new synonyms or deactivate existing ones. 