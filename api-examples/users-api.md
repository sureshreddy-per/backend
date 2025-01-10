# Users API Documentation

This document provides examples of user-related API endpoints and their responses. All endpoints require admin authentication unless specified otherwise.

## Get All Users

Get a paginated list of all users.

```http
GET /users?page=1&limit=10
Authorization: Bearer {admin_token}
```

### Response

```json
{
    "items": [
        {
            "id": "d69c4a09-0eca-425a-b8b3-d88850e36298",
            "name": "Admin User",
            "email": "admin@example.com",
            "mobile_number": "+1234567891",
            "role": "ADMIN",
            "status": "ACTIVE",
            "block_reason": null,
            "fcm_token": null,
            "avatar_url": null,
            "login_attempts": 0,
            "last_login_at": null,
            "scheduled_for_deletion_at": null,
            "created_at": "2025-01-09T13:51:23.920Z",
            "updated_at": "2025-01-09T13:51:30.577Z"
        },
        {
            "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
            "name": "Test User",
            "email": "test@example.com",
            "mobile_number": "+1234567890",
            "role": "FARMER",
            "status": "INACTIVE",
            "block_reason": null,
            "fcm_token": null,
            "avatar_url": null,
            "login_attempts": 0,
            "last_login_at": null,
            "scheduled_for_deletion_at": null,
            "created_at": "2025-01-09T13:44:55.415Z",
            "updated_at": "2025-01-09T13:46:04.684Z"
        }
    ],
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
}
```

## Get User by ID

Get a specific user by their ID.

```http
GET /users/{user_id}
Authorization: Bearer {admin_token}
```

### Response

```json
{
    "id": "d69c4a09-0eca-425a-b8b3-d88850e36298",
    "name": "Admin User",
    "email": "admin@example.com",
    "mobile_number": "+1234567891",
    "role": "ADMIN",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:51:23.920Z",
    "updated_at": "2025-01-09T13:51:30.577Z"
}
```

## Get Users by Role

Get all users with a specific role.

```http
GET /users/role/{role}
Authorization: Bearer {admin_token}
```

### Response

```json
[
    {
        "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
        "name": "Test User",
        "email": "test@example.com",
        "mobile_number": "+1234567890",
        "role": "FARMER",
        "status": "INACTIVE",
        "block_reason": null,
        "fcm_token": null,
        "avatar_url": null,
        "login_attempts": 0,
        "last_login_at": null,
        "scheduled_for_deletion_at": null,
        "created_at": "2025-01-09T13:44:55.415Z",
        "updated_at": "2025-01-09T13:46:04.684Z"
    }
]
```

## Update User

Update user information.

```http
PUT /users/{user_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "name": "Updated Test User",
    "email": "updated@example.com"
}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "INACTIVE",
    "block_reason": null,
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:06.868Z"
}
```

## Verify User

Verify a user's account.

```http
PUT /users/{user_id}/verify
Authorization: Bearer {admin_token}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:17.803Z"
}
```

## Block User

Block a user's account.

```http
POST /users/{user_id}/block
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "reason": "Suspicious activity"
}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "BLOCKED",
    "block_reason": "Suspicious activity",
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:25.600Z"
}
```

## Unblock User

Unblock a user's account.

```http
POST /users/{user_id}/unblock
Authorization: Bearer {admin_token}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:33.677Z"
}
```

## Schedule User Deletion

Schedule a user's account for deletion.

```http
POST /users/{user_id}/schedule-deletion
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "daysUntilDeletion": 7
}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": "2025-01-16T13:53:41.660Z",
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:41.661Z"
}
```

## Cancel Scheduled Deletion

Cancel a scheduled account deletion.

```http
POST /users/{user_id}/cancel-deletion
Authorization: Bearer {admin_token}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": null,
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:49.759Z"
}
```

## Update FCM Token

Update a user's FCM token for push notifications.

```http
PUT /users/{user_id}/fcm-token
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "fcm_token": "sample_fcm_token_123"
}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": "sample_fcm_token_123",
    "avatar_url": null,
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:53:59.921Z"
}
```

## Update Avatar

Update a user's avatar URL.

```http
PUT /users/{user_id}/avatar
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "avatar_url": "https://example.com/avatar.jpg"
}
```

### Response

```json
{
    "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
    "name": "Updated Test User",
    "email": "updated@example.com",
    "mobile_number": "+1234567890",
    "role": "FARMER",
    "status": "ACTIVE",
    "block_reason": null,
    "fcm_token": "sample_fcm_token_123",
    "avatar_url": "https://example.com/avatar.jpg",
    "login_attempts": 0,
    "last_login_at": null,
    "scheduled_for_deletion_at": null,
    "created_at": "2025-01-09T13:44:55.415Z",
    "updated_at": "2025-01-09T13:54:07.495Z"
}
``` 