# Buyer API Examples

## Buyer API Documentation

### Authentication
All endpoints require JWT authentication and BUYER role.

### Buyer Management
- `POST /buyers/profile` - Create buyer profile for authenticated user
- `GET /buyers/profile` - Get current buyer's profile
- `GET /buyers/nearby` - Find nearby buyers (Query params: lat, lng, radius)

### Produce Search
- `GET /produce` - Get all available produce (Query params: farm_id, status, produce_category, page, limit)
- `GET /produce/:id` - Get produce details
- `GET /produce/nearby` - Find nearby produce (Query params: lat, lon, radius)

### Offer Management
- `POST /offers` - Create a new offer
- `GET /offers` - Get all offers (filtered to own offers for non-admin users)
- `GET /offers/:id` - Get offer details
- `POST /offers/:id/reject` - Reject an offer with reason
- `POST /offers/:id/cancel` - Cancel an offer with reason
- `DELETE /offers/:id` - Delete an offer

### Auto-Offer Management
- `POST /auto-offers/buyer` - Set up auto-offer preferences for buyer

### Price Management
- `POST /buyer-prices/price-change` - Handle price change for produce (Body: produceId, newPrice)

### Transaction Management
- `POST /transactions` - Create a new transaction
- `GET /transactions/my-transactions` - Get authenticated user's transactions (Query params: page, limit)
- `GET /transactions/:id` - Get transaction details

### Support
- `POST /support` - Create support ticket
- `GET /support/my-tickets` - Get authenticated user's support tickets (Query params: page, limit)
- `GET /support/:id` - Get support ticket details
- `DELETE /support/:id` - Delete support ticket

### Notifications
- `GET /notifications` - Get unread notifications
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `POST /notifications/:id/mark-read` - Mark notification as read

### Ratings
- `POST /ratings` - Create a rating
- `GET /ratings/given` - Get ratings given by authenticated user
- `GET /ratings/received` - Get ratings received by authenticated user
- `GET /ratings/:id` - Get rating details
- `DELETE /ratings/:id` - Delete a rating
- `GET /ratings/transaction/:transactionId` - Get ratings for a transaction