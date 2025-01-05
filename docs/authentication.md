# Authentication Guide

This guide explains how to authenticate with the API and use protected endpoints.

## Authentication Flow

1. Request OTP
2. Verify OTP and receive JWT token
3. (Optional) Register additional user details
4. Use JWT token for protected endpoints

## Request OTP

Request an OTP for authentication using the `/auth/otp/request` endpoint.

\`\`\`typescript
// HTTP POST /auth/otp/request
const response = await fetch('/auth/otp/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobileNumber: '+1234567890',
  }),
});

const data = await response.json();
// Response: { requestId: string, expiresIn: number, isNewUser: boolean }
\`\`\`

## Verify OTP

Verify the OTP and get a JWT token using the `/auth/otp/verify` endpoint.

\`\`\`typescript
// HTTP POST /auth/otp/verify
const response = await fetch('/auth/otp/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobileNumber: '+1234567890',
    otp: '123456',
  }),
});

const data = await response.json();
// Response: { token: string, user: User }
\`\`\`

## Register Additional Details

For new users, register additional details after OTP verification.

\`\`\`typescript
// HTTP POST /auth/register
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`, // Token from OTP verification
  },
  body: JSON.stringify({
    mobileNumber: '+1234567890',
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['FARMER'],
  }),
});

const data = await response.json();
// Response: { user: User }
\`\`\`

## Using JWT Token

Include the JWT token in the Authorization header for protected endpoints.

\`\`\`typescript
const token = 'your_jwt_token_here';

// Example: Fetch user profile
const response = await fetch('/users/profile', {
  headers: {
    'Authorization': \`Bearer \${token}\`,
  },
});

const profile = await response.json();
\`\`\`

## WebSocket Authentication

Connect to WebSocket endpoints with JWT token.

\`\`\`typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000/notifications', {
  auth: {
    token: 'your_jwt_token_here',
  },
});

socket.on('connect', () => {
  console.log('Connected to notifications');
});

socket.on('notification', (data) => {
  console.log('Received notification:', data);
});
\`\`\`

## Role-Based Access

Different endpoints require different roles. The roles are:
- \`ADMIN\`: Full access to all endpoints
- \`FARMER\`: Access to farmer-specific endpoints
- \`BUYER\`: Access to buyer-specific endpoints

Example of role-protected endpoint:

\`\`\`typescript
// Only buyers can create offers
const createOffer = async (produceId: string, price: number) => {
  const response = await fetch('/offers', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      produceId,
      price,
    }),
  });

  return response.json();
};
\`\`\`

## Error Handling

Authentication errors you might encounter:

\`\`\`typescript
// Invalid OTP
{
  "statusCode": 401,
  "message": "Invalid OTP",
  "error": "Unauthorized"
}

// Missing token
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// Invalid token
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}

// Insufficient permissions
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}

// Rate limit exceeded
{
  "statusCode": 429,
  "message": "Too many OTP requests",
  "error": "Too Many Requests"
}
\`\`\`

## Security Best Practices

1. Always use HTTPS in production
2. Store tokens securely (e.g., HttpOnly cookies)
3. Never expose tokens in URLs or logs
4. Implement token refresh mechanism
5. Implement rate limiting for OTP requests
6. Monitor for suspicious activities
7. Use secure SMS gateway for OTP delivery

## OTP Security Guidelines

1. OTP expires after 5 minutes
2. Maximum 3 verification attempts per OTP
3. Maximum 5 OTP requests per phone number in 24 hours
4. 1-minute cooldown period between OTP requests
5. Previous OTPs are invalidated when requesting new ones
6. OTP is always 6 digits
7. OTP is sent via SMS only 