# API Reference

This document provides detailed information about all API endpoints, including request/response schemas, authentication requirements, and examples.

## Authentication

### Buyer Authentication Options

#### 1. Email SSO Login

\`\`\`http
POST /auth/buyer/sso/email
Content-Type: application/json
\`\`\`

Authenticate buyer using email SSO.

##### Request Schema
\`\`\`typescript
{
  email: string;    // Business email address
  provider: string; // "GOOGLE" | "MICROSOFT" | "APPLE"
  token: string;    // OAuth token from provider
}
\`\`\`

##### Response Schema

###### Success (200 OK)
\`\`\`typescript
{
  access_token: string;     // JWT token
  user: {
    id: string;
    email: string;
    name: string;
    companyName: string;
    type: "buyer";
  };
}
\`\`\`

#### 2. Phone Number Login (Buyers)

\`\`\`http
POST /auth/buyer/phone/request
Content-Type: application/json
\`\`\`

Request OTP for phone login (buyers).

##### Request Schema
\`\`\`typescript
{
  phoneNumber: string;  // Phone number with country code
  companyName: string; // Required for first-time login
}
\`\`\`

##### Response Schema

###### Success (200 OK)
\`\`\`typescript
{
  requestId: string;    // OTP request ID
  expiresIn: number;   // OTP expiry in seconds
}
\`\`\`

\`\`\`http
POST /auth/buyer/phone/verify
Content-Type: application/json
\`\`\`

Verify OTP and login (buyers).

##### Request Schema
\`\`\`typescript
{
  requestId: string;   // OTP request ID
  otp: string;        // 6-digit OTP
}
\`\`\`

##### Response Schema

###### Success (200 OK)
\`\`\`typescript
{
  access_token: string;
  user: {
    id: string;
    phoneNumber: string;
    name: string;
    companyName: string;
    type: "buyer";
  };
}
\`\`\`

### Customer Authentication (Mobile OTP Only)

#### 1. Request OTP

\`\`\`http
POST /auth/customer/otp/request
Content-Type: application/json
\`\`\`

Request OTP for customer login.

##### Request Schema
\`\`\`typescript
{
  mobileNumber: string;  // Mobile number with country code
  name?: string;        // Required for first-time login
  farmLat?: number;     // Required for first-time login
  farmLng?: number;     // Required for first-time login
}
\`\`\`

##### Response Schema

###### Success (200 OK)
\`\`\`typescript
{
  requestId: string;    // OTP request ID
  expiresIn: number;   // OTP expiry in seconds
  isNewUser: boolean;  // Whether this is a first-time login
}
\`\`\`

#### 2. Verify OTP

\`\`\`http
POST /auth/customer/otp/verify
Content-Type: application/json
\`\`\`

Verify OTP and login customer.

##### Request Schema
\`\`\`typescript
{
  requestId: string;   // OTP request ID
  otp: string;        // 6-digit OTP
  // Additional fields required for first-time login
  name?: string;      // Required if isNewUser=true
  farmLat?: number;   // Required if isNewUser=true
  farmLng?: number;   // Required if isNewUser=true
}
\`\`\`

##### Response Schema

###### Success (200 OK)
\`\`\`typescript
{
  access_token: string;
  user: {
    id: string;
    mobileNumber: string;
    name: string;
    type: "customer";
    farmLocation: {
      lat: number;
      lng: number;
    };
  };
}
\`\`\`

### Common Authentication Errors

#### Invalid OTP (401 Unauthorized)
\`\`\`typescript
{
  statusCode: 401;
  message: "Invalid OTP";
  error: "Unauthorized";
}
\`\`\`

#### Expired OTP (401 Unauthorized)
\`\`\`typescript
{
  statusCode: 401;
  message: "OTP has expired";
  error: "Unauthorized";
}
\`\`\`

#### Invalid SSO Token (401 Unauthorized)
\`\`\`typescript
{
  statusCode: 401;
  message: "Invalid SSO token";
  error: "Unauthorized";
}
\`\`\`

#### Too Many OTP Attempts (429 Too Many Requests)
\`\`\`typescript
{
  statusCode: 429;
  message: "Too many OTP attempts";
  error: "Too Many Requests";
  retryAfter: number; // Seconds to wait before retrying
}
\`\`\`

#### Missing Required Fields (400 Bad Request)
\`\`\`typescript
{
  statusCode: 400;
  message: "Missing required fields for new user",
  errors: [
    {
      field: string;
      message: string;
    }
  ];
}
\`\`\`

### Register User

\`\`\`http
POST /auth/register
Content-Type: application/json
\`\`\`

Register a new user (customer or buyer).

#### Request Schema

##### Customer Registration
\`\`\`typescript
{
  name: string;        // Full name of the customer
  email: string;       // Valid email address
  password: string;    // Min 8 characters, must include number and special char
  mobileNumber: string;// Valid phone number with country code
  farmLat: number;     // Farm latitude (-90 to 90)
  farmLng: number;     // Farm longitude (-180 to 180)
  type: "customer";    // User type
}
\`\`\`

##### Buyer Registration
\`\`\`typescript
{
  name: string;        // Full name of the buyer
  email: string;       // Valid email address
  password: string;    // Min 8 characters, must include number and special char
  mobileNumber: string;// Valid phone number with country code
  companyName: string; // Company/organization name
  lat: number;         // Location latitude (-90 to 90)
  lng: number;         // Location longitude (-180 to 180)
  type: "buyer";       // User type
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  id: string;         // Unique user ID
  email: string;      // User's email
  name: string;       // User's name
  type: string;       // "customer" or "buyer"
  createdAt: string;  // ISO date string
}
\`\`\`

##### Error (400 Bad Request)
\`\`\`typescript
{
  statusCode: 400;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
\`\`\`

### Login

\`\`\`http
POST /auth/login
Content-Type: application/json
\`\`\`

Authenticate user and get JWT token.

#### Request Schema
\`\`\`typescript
{
  email: string;    // User's email
  password: string; // User's password
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  access_token: string; // JWT token
}
\`\`\`

##### Error (401 Unauthorized)
\`\`\`typescript
{
  statusCode: 401;
  message: "Invalid credentials";
  error: "Unauthorized";
}
\`\`\`

## Produce Management

### Create Produce Listing

\`\`\`http
POST /produce
Authorization: Bearer {token}
Content-Type: multipart/form-data
\`\`\`

Create a new produce listing.

#### Request Schema
\`\`\`typescript
{
  type: string;         // Produce type (e.g., "WHEAT", "RICE")
  quantity: number;     // Amount of produce
  unit: string;         // Unit of measurement (e.g., "KG", "TON")
  expectedPrice: number;// Expected price per unit
  description: string;  // Produce description
  photos: File[];      // Product photos (max 5)
  video?: File;        // Optional product video
  location: {          // Produce location
    lat: number;       // Latitude
    lng: number;       // Longitude
  };
}
\`\`\`

#### Response Schema

##### Success (201 Created)
\`\`\`typescript
{
  id: string;           // Unique produce ID
  type: string;         // Produce type
  quantity: number;     // Amount
  unit: string;         // Unit
  expectedPrice: number;// Price per unit
  description: string;  // Description
  photos: string[];    // Photo URLs
  video?: string;      // Video URL
  location: {
    lat: number;
    lng: number;
  };
  status: string;       // "AVAILABLE"
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
}
\`\`\`

### Get Produce Listings

\`\`\`http
GET /produce
Authorization: Bearer {token}
\`\`\`

Get all produce listings with optional filters.

#### Query Parameters
\`\`\`typescript
{
  type?: string;      // Filter by produce type
  lat?: number;       // Location latitude
  lng?: number;       // Location longitude
  radius?: number;    // Search radius in km
  status?: string;    // Filter by status
  page?: number;      // Page number (default: 1)
  limit?: number;     // Items per page (default: 10)
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  items: Array<{
    id: string;
    type: string;
    quantity: number;
    unit: string;
    expectedPrice: number;
    description: string;
    photos: string[];
    video?: string;
    location: {
      lat: number;
      lng: number;
    };
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    total: number;      // Total items
    page: number;       // Current page
    lastPage: number;   // Last page number
    hasNextPage: boolean;
  };
}
\`\`\`

## Notifications

### Get Notifications

\`\`\`http
GET /notifications
Authorization: Bearer {token}
\`\`\`

Get user's notifications.

#### Query Parameters
\`\`\`typescript
{
  read?: boolean;    // Filter by read status
  page?: number;     // Page number (default: 1)
  limit?: number;    // Items per page (default: 20)
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  items: Array<{
    id: string;
    type: string;      // Notification type
    message: string;   // Notification message
    data?: any;        // Additional data
    read: boolean;     // Read status
    createdAt: string; // ISO date string
  }>;
  meta: {
    total: number;
    page: number;
    lastPage: number;
    hasNextPage: boolean;
  };
}
\`\`\`

### Update Notification Preferences

\`\`\`http
PUT /notifications/preferences
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Update user's notification preferences.

#### Request Schema
\`\`\`typescript
{
  email: {
    offers: boolean;
    transactions: boolean;
    support: boolean;
    marketing: boolean;
  };
  push: {
    offers: boolean;
    transactions: boolean;
    support: boolean;
    marketing: boolean;
  };
  sms: {
    offers: boolean;
    transactions: boolean;
    support: boolean;
    marketing: boolean;
  };
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  email: {
    offers: boolean;
    transactions: boolean;
    support: boolean;
    marketing: boolean;
  };
  push: {
    offers: boolean;
    transactions: boolean;
    support: boolean;
    marketing: boolean;
  };
  sms: {
    offers: boolean;
    transactions: boolean;
    support: boolean;
    marketing: boolean;
  };
  updatedAt: string; // ISO date string
}
\`\`\`

## Support

### Create Support Ticket

\`\`\`http
POST /support
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Create a new support ticket.

#### Request Schema
\`\`\`typescript
{
  title: string;       // Ticket title
  description: string; // Detailed description
  type: string;        // "TECHNICAL" | "PAYMENT" | "GENERAL"
  priority: string;    // "LOW" | "MEDIUM" | "HIGH"
}
\`\`\`

#### Response Schema

##### Success (201 Created)
\`\`\`typescript
{
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;      // "OPEN"
  responses: [];       // Empty array initially
  createdAt: string;   // ISO date string
  updatedAt: string;   // ISO date string
}
\`\`\`

### Add Ticket Response

\`\`\`http
POST /support/{ticketId}/responses
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Add a response to a support ticket.

#### Request Schema
\`\`\`typescript
{
  response: string; // Response message
}
\`\`\`

#### Response Schema

##### Success (201 Created)
\`\`\`typescript
{
  id: string;
  ticketId: string;
  message: string;
  isAdminResponse: boolean;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

## Common Error Responses

### Authentication Errors

#### Invalid Token (401 Unauthorized)
\`\`\`typescript
{
  statusCode: 401;
  message: "Invalid token";
  error: "Unauthorized";
}
\`\`\`

#### Missing Token (401 Unauthorized)
\`\`\`typescript
{
  statusCode: 401;
  message: "Missing authentication token";
  error: "Unauthorized";
}
\`\`\`

#### Insufficient Permissions (403 Forbidden)
\`\`\`typescript
{
  statusCode: 403;
  message: "Insufficient permissions";
  error: "Forbidden";
}
\`\`\`

### Validation Errors (400 Bad Request)
\`\`\`typescript
{
  statusCode: 400;
  message: "Validation failed";
  errors: Array<{
    field: string;
    message: string;
  }>;
}
\`\`\`

### Resource Not Found (404 Not Found)
\`\`\`typescript
{
  statusCode: 404;
  message: "Resource not found";
  error: "Not Found";
}
\`\`\`

### Rate Limit Exceeded (429 Too Many Requests)
\`\`\`typescript
{
  statusCode: 429;
  message: "Too many requests";
  error: "Too Many Requests";
  retryAfter: number; // Seconds to wait before retrying
}
\`\`\`

## Offers

### Create Offer

\`\`\`http
POST /offers
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Create a new offer for a produce listing (buyers only).

#### Request Schema
\`\`\`typescript
{
  produceId: string;   // ID of the produce listing
  price: number;       // Offered price per unit
  quantity: number;    // Quantity to purchase
  message?: string;    // Optional message to seller
  validUntil?: string; // Offer validity (ISO date string)
}
\`\`\`

#### Response Schema

##### Success (201 Created)
\`\`\`typescript
{
  id: string;
  produceId: string;
  buyerId: string;
  price: number;
  quantity: number;
  message?: string;
  status: string;      // "PENDING"
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Get Offers

\`\`\`http
GET /offers
Authorization: Bearer {token}
\`\`\`

Get offers (filtered by user role - buyers see their sent offers, customers see received offers).

#### Query Parameters
\`\`\`typescript
{
  status?: string;    // Filter by status
  produceId?: string; // Filter by produce
  page?: number;      // Page number (default: 1)
  limit?: number;     // Items per page (default: 10)
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  items: Array<{
    id: string;
    produceId: string;
    buyerId: string;
    price: number;
    quantity: number;
    message?: string;
    status: string;
    validUntil?: string;
    createdAt: string;
    updatedAt: string;
    produce: {         // Included produce details
      id: string;
      type: string;
      quantity: number;
      unit: string;
      expectedPrice: number;
    };
    buyer: {           // Included buyer details
      id: string;
      name: string;
      companyName: string;
    };
  }>;
  meta: {
    total: number;
    page: number;
    lastPage: number;
    hasNextPage: boolean;
  };
}
\`\`\`

### Update Offer Status

\`\`\`http
PATCH /offers/{offerId}/status
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Update offer status (customers can accept/reject, buyers can withdraw).

#### Request Schema
\`\`\`typescript
{
  status: string;     // "ACCEPTED" | "REJECTED" | "WITHDRAWN"
  message?: string;   // Optional status change message
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  id: string;
  status: string;
  message?: string;
  updatedAt: string;
}
\`\`\`

## Transactions

### Create Transaction

\`\`\`http
POST /transactions
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Create a new transaction from an accepted offer (buyers only).

#### Request Schema
\`\`\`typescript
{
  offerId: string;           // ID of the accepted offer
  paymentMethod: string;     // "BANK_TRANSFER" | "DIGITAL_WALLET"
  paymentDetails: {          // Payment-specific details
    accountNumber?: string;
    bankName?: string;
    walletId?: string;
  };
}
\`\`\`

#### Response Schema

##### Success (201 Created)
\`\`\`typescript
{
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  amount: number;      // Total transaction amount
  status: string;      // "PENDING"
  paymentMethod: string;
  paymentDetails: {
    accountNumber?: string;
    bankName?: string;
    walletId?: string;
  };
  createdAt: string;
  updatedAt: string;
}
\`\`\`

### Get Transactions

\`\`\`http
GET /transactions
Authorization: Bearer {token}
\`\`\`

Get user's transactions.

#### Query Parameters
\`\`\`typescript
{
  status?: string;    // Filter by status
  startDate?: string; // Filter by date range (ISO date)
  endDate?: string;   // Filter by date range (ISO date)
  page?: number;      // Page number (default: 1)
  limit?: number;     // Items per page (default: 10)
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  items: Array<{
    id: string;
    offerId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paymentDetails: {
      accountNumber?: string;
      bankName?: string;
      walletId?: string;
    };
    offer: {           // Included offer details
      id: string;
      price: number;
      quantity: number;
      produce: {
        id: string;
        type: string;
        unit: string;
      };
    };
    buyer: {           // Included buyer details
      id: string;
      name: string;
      companyName: string;
    };
    seller: {          // Included seller details
      id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    lastPage: number;
    hasNextPage: boolean;
  };
}
\`\`\`

### Update Transaction Status

\`\`\`http
PATCH /transactions/{transactionId}/status
Authorization: Bearer {token}
Content-Type: application/json
\`\`\`

Update transaction status (admin only).

#### Request Schema
\`\`\`typescript
{
  status: string;     // "COMPLETED" | "FAILED" | "REFUNDED"
  message?: string;   // Optional status change message
}
\`\`\`

#### Response Schema

##### Success (200 OK)
\`\`\`typescript
{
  id: string;
  status: string;
  message?: string;
  updatedAt: string;
}
\`\`\`

### Get Transaction Receipt

\`\`\`http
GET /transactions/{transactionId}/receipt
Authorization: Bearer {token}
\`\`\`

Get transaction receipt (PDF).

#### Response

##### Success (200 OK)
\`\`\`http
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt-{transactionId}.pdf"
\`\`\`

Binary PDF file containing the transaction receipt. 