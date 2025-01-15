# AgroChain API Collections

This directory contains Postman collections for testing and interacting with the AgroChain API. The collections are organized by user roles to make it easier to test different functionalities based on user permissions.

## Collections

1. **Admin Collection (`admin_collection.json`)**
   - Authentication endpoints
   - User management
   - System configuration
   - Analytics and reporting
   - Audit logs
   - Integration management
   - Webhook management

2. **Farmer Collection (`farmer_collection.json`)**
   - Authentication endpoints
   - Profile management
   - Produce management
   - Quality inspection requests
   - Offer management (receiving and responding)
   - Transaction history
   - Report generation
   - Support tickets

3. **Buyer Collection (`buyer_collection.json`)**
   - Authentication endpoints
   - Profile management
   - Produce search and viewing
   - Offer management (creating and tracking)
   - Transaction management
   - Payment processing
   - Report generation
   - Support tickets

4. **Inspector Collection (`inspector_collection.json`)**
   - Authentication endpoints
   - Profile management with specializations
   - Quality inspection management
   - Inspection report submission
   - Inspection status updates
   - Report generation
   - Support tickets

## Environment

The `agrochain_environment.json` file contains environment variables used across all collections:

- `base_url`: The base URL for the API (default: `http://localhost:3000/api`)
- `admin_token`: Authentication token for admin users
- `farmer_token`: Authentication token for farmer users
- `buyer_token`: Authentication token for buyer users
- `inspector_token`: Authentication token for inspector users

## Setup Instructions

1. Import the collections and environment into Postman:
   - Open Postman
   - Click on "Import" button
   - Select all JSON files from this directory
   - Click "Import" to complete

2. Set up the environment:
   - In Postman, click on the environment dropdown (top-right)
   - Select "AgroChain Environment"
   - The `base_url` will be pre-configured
   - You'll need to obtain tokens by using the authentication endpoints

3. Authentication Flow:
   - Use "Check Mobile" to verify if a user exists
   - If not, use "Register" with appropriate role
   - Request OTP using "Request OTP"
   - Verify OTP to get authentication token
   - Copy the token to the appropriate environment variable

## Usage Tips

1. **Authentication**:
   - Always start with authentication to get valid tokens
   - Tokens are role-specific, so use the correct token variable

2. **Testing Endpoints**:
   - Each collection is organized by feature groups
   - Use the pre-request scripts to ensure proper authentication
   - Check response codes and bodies for proper error handling

3. **Environment Variables**:
   - Keep tokens updated as they expire
   - Update `base_url` if deploying to different environments

4. **Security**:
   - Never commit tokens to version control
   - Reset tokens if they're ever exposed
   - Use environment variables for sensitive data

## Common Operations

### Admin Operations
1. System Configuration
   - Get and update system settings
   - Manage fee structures
   - Monitor system health

2. User Management
   - View all users
   - Verify/block/unblock users
   - View user analytics

### Farmer Operations
1. Produce Management
   - List produce
   - Update produce details
   - Track quality inspections

2. Offer Management
   - View received offers
   - Accept/reject offers
   - Track transactions

### Buyer Operations
1. Produce Discovery
   - Search available produce
   - View produce details
   - Track quality certifications

2. Transaction Management
   - Make offers
   - Process payments
   - Track purchase history

### Inspector Operations
1. Quality Management
   - View pending inspections
   - Accept inspection requests
   - Submit inspection reports
   - Update inspection status

2. Report Management
   - Generate inspection reports
   - Track inspection history
   - Manage quality certifications

## Support

For any issues or questions:
1. Create a support ticket using the appropriate endpoint
2. Include relevant request/response details
3. Specify the collection and endpoint having issues 