# API Endpoints Documentation

## Farmer App Endpoints

### Authentication
- `POST /auth/check-mobile` - Check if mobile number is registered
- `POST /auth/register` - Register a new user
- `POST /auth/otp/request` - Request OTP for login
- `POST /auth/otp/verify` - Verify OTP and get JWT token
- `POST /auth/logout` - Logout user
- `DELETE /auth/account` - Delete user account
- `GET /auth/validate` - Validate JWT token

### Profile Management
- `POST /farmers` - Create new farmer profile
- `GET /farmers/profile` - Get farmer profile
- `PATCH /farmers/profile/user-details` - Update farmer profile details
- `POST /farmers/farms` - Add a new farm
- `GET /farmers/farms/:farmId` - Get farm details
- `PATCH /farmers/farms/:farmId` - Update farm details
- `POST /farmers/bank-accounts` - Add bank account
- `GET /farmers/bank-accounts/:accountId` - Get bank account details
- `PATCH /farmers/bank-accounts/:accountId` - Update bank account details

### Produce Management
- `POST /produce` - Create new produce listing (supports images and video)
- `GET /produce` - List all produce
- `GET /produce/:id` - Get produce details
- `PATCH /produce/:id` - Update produce details
- `DELETE /produce/:id` - Delete produce listing
- `POST /produce/request-ai-verification` - Request AI verification for produce
- `POST /quality/inspections/request` - Request manual quality inspection
- `GET /quality/inspections/:id` - Get inspection request status

### Offers & Transactions
- `GET /offers/:id` - View offer details for farmer's produce
- `GET /farmers/offers/:offerId/details` - Get farmer details for an offer
- `GET /transactions` - View farmer's transactions
- `GET /transactions/:id` - Get transaction details
- `POST /transactions/:id/start-delivery` - Start delivery process
- `POST /transactions/:id/confirm-delivery` - Confirm produce delivery
- `POST /transactions/:id/cancel` - Cancel transaction
- `POST /transactions/:id/reactivate` - Reactivate expired transaction

### Ratings
- `POST /ratings` - Create a new rating
- `GET /ratings/received` - Get ratings received by the farmer
- `GET /ratings/given` - Get ratings given by the farmer
- `GET /ratings/:id` - Get specific rating details
- `GET /ratings/transaction/:id` - Get ratings for a transaction
- `DELETE /ratings/:id` - Delete a rating

### Support & Notifications
- `POST /support` - Create support ticket
- `GET /support` - Get all support tickets
- `GET /support/:id` - Get support ticket details
- `DELETE /support/:id` - Delete support ticket
- `GET /notifications` - Get notifications
- `PUT /notifications/preferences` - Update notification preferences
- `PUT /notifications/:id/read` - Mark notification as read
- `DELETE /notifications/:id` - Delete notification
- `PUT /users/:id/fcm-token` - Update FCM token for push notifications

## Buyer App Endpoints

### Authentication
- Same authentication endpoints as Farmer App

### Profile Management
- `GET /users/me` - Get user profile
- `PUT /users/:id/avatar` - Update profile avatar

### Offers Management
- `GET /offers` - Get all offers
- `GET /offers/:id` - Get offer details
- `POST /offers` - Create new offer
- `PUT /offers/:id` - Update offer
- `DELETE /offers/:id` - Delete offer
- `POST /offers/:id/approve` - Approve auto-generated offer
- `POST /offers/:id/reject` - Reject auto-generated offer (requires reason)
- `POST /offers/:id/cancel` - Cancel an offer (requires reason)
- `PUT /offers/:id/override-price` - Override offer price
- `GET /offers/stats` - Get offer statistics

### Transactions
- `POST /transactions` - Create new transaction
- `GET /transactions` - Get buyer's transactions
- `GET /transactions/:id` - Get transaction details
- `POST /transactions/:id/confirm-inspection` - Confirm produce inspection
- `POST /transactions/:id/complete` - Complete transaction
- `POST /transactions/:id/cancel` - Cancel transaction

### Ratings
- `POST /ratings` - Create a new rating
- `GET /ratings/received` - Get ratings received by the buyer
- `GET /ratings/given` - Get ratings given by the buyer
- `GET /ratings/:id` - Get specific rating details
- `GET /ratings/transaction/:id` - Get ratings for a transaction
- `DELETE /ratings/:id` - Delete a rating

### Produce Discovery
- `GET /farmers/nearby` - Find nearby farmers
- `GET /produce` - Browse produce listings
- `GET /produce/:id` - Get produce details

### Support & Notifications
- Same support and notification endpoints as Farmer App

## Inspector Endpoints

### Profile Management
- `POST /inspectors` - Create inspector profile
- `GET /inspectors/profile` - Get inspector profile
- `GET /inspectors/:id` - Get inspector details
- `PATCH /inspectors/:id` - Update inspector profile
- `GET /inspectors/nearby` - Find nearby inspectors

### Quality Assessment
- `POST /quality/:id/inspect` - Submit inspection result
- `GET /quality/pending` - Get pending inspections
- `GET /quality/completed` - Get completed inspections
- `GET /quality/:id` - Get inspection details

### Reports
- `POST /reports` - Create a new report
- `GET /reports` - Get user reports
- `GET /reports/:id` - Get report details
- `GET /reports/types`