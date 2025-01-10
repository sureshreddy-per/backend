# Authentication API Documentation

This document provides examples of authentication-related API endpoints and their responses.

## Check Mobile Number

Check if a mobile number is already registered.

```http
POST /auth/check-mobile
Content-Type: application/json

{
    "mobile_number": "+1234567890"
}
```

### Response

```json
{
    "isRegistered": false
}
```

## Register New User

Register a new user with mobile number, name, email, and role.

```http
POST /auth/register
Content-Type: application/json

{
    "mobile_number": "+1234567890",
    "name": "Test User",
    "email": "test@example.com",
    "role": "FARMER"
}
```

### Response

```json
{
    "requestId": "buvxvoana2h",
    "message": "User registered successfully. OTP sent: 532157"
}
```

## Verify OTP

Verify the OTP received during registration or login.

```http
POST /auth/otp/verify
Content-Type: application/json

{
    "mobile_number": "+1234567890",
    "otp": "532157"
}
```

### Response

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZDVhNGE1ZC0yOWY2LTRlMDAtYjhlYS0wYTI0NmY5MDNhODEiLCJtb2JpbGVfbnVtYmVyIjoiKzEyMzQ1Njc4OTAiLCJyb2xlIjoiRkFSTUVSIiwiaWF0IjoxNzM2NDMwMzAxLCJleHAiOjE3MzY1MTY3MDF9.eeJs3g1FpAT7hZTBGgXp4iJD9TzmOeaVw5lHx1DPWwc",
    "user": {
        "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
        "name": "Test User",
        "email": "test@example.com",
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
        "updated_at": "2025-01-09T13:44:55.415Z"
    }
}
```

## Request OTP

Request a new OTP for an existing user.

```http
POST /auth/otp/request
Content-Type: application/json

{
    "mobile_number": "+1234567890"
}
```

### Response

```json
{
    "message": "OTP sent successfully: 902679",
    "requestId": "v7cai7p5kwn"
}
```

## Validate Token

Validate JWT token and get user profile.

```http
GET /auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZDVhNGE1ZC0yOWY2LTRlMDAtYjhlYS0wYTI0NmY5MDNhODEiLCJtb2JpbGVfbnVtYmVyIjoiKzEyMzQ1Njc4OTAiLCJyb2xlIjoiRkFSTUVSIiwiaWF0IjoxNzM2NDMwMzAxLCJleHAiOjE3MzY1MTY3MDF9.eeJs3g1FpAT7hZTBGgXp4iJD9TzmOeaVw5lHx1DPWwc
```

### Response

```json
{
    "valid": true,
    "user": {
        "id": "8d5a4a5d-29f6-4e00-b8ea-0a246f903a81",
        "name": "Test User",
        "email": "test@example.com",
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
        "updated_at": "2025-01-09T13:45:01.247Z"
    }
}
```

## Logout

Logout and invalidate the JWT token.

```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZDVhNGE1ZC0yOWY2LTRlMDAtYjhlYS0wYTI0NmY5MDNhODEiLCJtb2JpbGVfbnVtYmVyIjoiKzEyMzQ1Njc4OTAiLCJyb2xlIjoiRkFSTUVSIiwiaWF0IjoxNzM2NDMwMzAxLCJleHAiOjE3MzY1MTY3MDF9.eeJs3g1FpAT7hZTBGgXp4iJD9TzmOeaVw5lHx1DPWwc
```

### Response

```json
{
    "message": "Successfully logged out"
}
``` 