# Authentication Guide

This guide explains how to authenticate with the API and use protected endpoints.

## Registration

Register a new user (customer or buyer) using the `/auth/register` endpoint.

### Customer Registration Example

\`\`\`typescript
// HTTP POST /auth/register
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123',
    mobileNumber: '+1234567890',
    farmLat: 12.345678,
    farmLng: 98.765432,
    type: 'customer',
  }),
});

const data = await response.json();
// Response: { id: string, email: string, ... }
\`\`\`

### Buyer Registration Example

\`\`\`typescript
// HTTP POST /auth/register
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@company.com',
    password: 'securePassword123',
    mobileNumber: '+1234567890',
    companyName: 'Smith Trading Co.',
    lat: 12.345678,
    lng: 98.765432,
    type: 'buyer',
  }),
});

const data = await response.json();
// Response: { id: string, email: string, ... }
\`\`\`

## Login

Login to get a JWT token using the `/auth/login` endpoint.

\`\`\`typescript
// HTTP POST /auth/login
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123',
  }),
});

const data = await response.json();
// Response: { access_token: string }
\`\`\`

## Using JWT Token

Include the JWT token in the Authorization header for protected endpoints.

\`\`\`typescript
const token = 'your_jwt_token_here';

// Example: Fetch user profile
const response = await fetch('/customers/profile', {
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
- \`admin\`: Full access to all endpoints
- \`customer\`: Access to customer-specific endpoints
- \`buyer\`: Access to buyer-specific endpoints

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
// Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
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
\`\`\`

## Security Best Practices

1. Always use HTTPS in production
2. Store tokens securely (e.g., HttpOnly cookies)
3. Never expose tokens in URLs or logs
4. Implement token refresh mechanism
5. Use strong passwords
6. Implement rate limiting
7. Monitor for suspicious activities

Example token refresh:

\`\`\`typescript
const refreshToken = async () => {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  const data = await response.json();
  return data.access_token;
};
\`\`\` 