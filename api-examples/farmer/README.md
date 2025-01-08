# Farmer API Examples

## Farmer API Documentation

### Authentication
All endpoints require JWT authentication and FARMER role.

### Farmer Management
- `POST /farmers` - Create a farmer profile for the authenticated user
- `GET /farmers/profile` - Get current farmer's profile
- `GET /farmers/nearby` - Find nearby farmers (Query params: lat, lng, radius)
- `PATCH /farmers/profile/user-details` - Update farmer's user details (Body: name, email, profile_picture, status)
- `GET /farmers/offers/:offerId/details` - Get farmer details for a specific offer

### Farm Management
- `POST /farmers/farms` - Add a new farm (Body: location, size, crops)
- `PATCH /farmers/farms/:farmId` - Update farm details
- `GET /farmers/farms/:farmId` - Get farm details

### Bank Account Management
- `POST /farmers/bank-accounts` - Add bank account (Body: accountNumber, bankName, accountType)
- `PATCH /farmers/bank-accounts/:accountId` - Update bank account details
- `GET /farmers/bank-accounts/:accountId` - Get bank account details

### Produce Management
- `POST /produce` - Create new produce listing (Body: farm_id, category, quantity, price)
- `GET /produce` - Get all produce listings (Query params: farm_id, status, produce_category, page, limit)
- `GET /produce/my-produce` - Get authenticated farmer's produce listings
- `GET /produce/nearby` - Find nearby produce (Query params: lat, lon, radius)
- `GET /produce/:id` - Get produce details
- `PATCH /produce/:id` - Update produce listing
- `DELETE /produce/:id` - Delete produce listing

### Offer Management
- `GET /offers/received-offers` - Get offers received for your produce
- `GET /offers/:id` - Get offer details
- `POST /offers/:id/accept` - Accept an offer
- `POST /offers/:id/reject` - Reject an offer with reason

### Transaction Management
- `GET /transactions/my-transactions` - Get authenticated user's transactions (Query params: page, limit)
- `GET /transactions/:id` - Get transaction details

### Support
- `POST /support` - Create support ticket (Body: title, description, priority)
- `GET /support/my-tickets` - Get authenticated user's support tickets (Query params: page, limit)
- `GET /support/:id` - Get support ticket details
- `DELETE /support/:id` - Delete support ticket

### Notifications
- `GET /notifications` - Get unread notifications
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `POST /notifications/:id/mark-read` - Mark notification as read

### Ratings
- `GET /ratings/received` - Get ratings received by authenticated user
- `GET /ratings/:id` - Get rating details
- `GET /ratings/transaction/:transactionId` - Get ratings for a transaction

### File Upload
- `POST /upload/image` - Upload images (max size: 5MB, formats: jpg, png)
- `POST /upload/video` - Upload videos (max size: 50MB, formats: mp4, mov)
- `POST /upload/documents` - Upload documents (max 5 files, formats: pdf, doc)