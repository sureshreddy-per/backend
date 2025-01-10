# API Endpoints Documentation

## 1. Authentication
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/register` - Register new user
- `POST /api/auth/check-mobile` - Check mobile number
- `GET /api/auth/profile` - Get user profile
- `DELETE /api/auth/logout` - Logout

## 2. Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID (Admin)
- `GET /api/users/role/:role` - Get users by role (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `PUT /api/users/:id/verify` - Verify user (Admin)
- `POST /api/users/:id/block` - Block user (Admin)
- `POST /api/users/:id/unblock` - Unblock user (Admin)
- `POST /api/users/:id/schedule-deletion` - Schedule user deletion (Admin)
- `POST /api/users/:id/cancel-deletion` - Cancel scheduled deletion (Admin)
- `PUT /api/users/:id/fcm-token` - Update FCM token
- `PUT /api/users/:id/avatar` - Update avatar

## 3. Produce
- `POST /api/produce` - Create produce listing
- `GET /api/produce` - Get all produce with filters
- `GET /api/produce/nearby` - Find nearby produce
- `GET /api/produce/:id` - Get produce by ID
- `PATCH /api/produce/:id` - Update produce
- `DELETE /api/produce/:id` - Delete produce

## 4. Produce Synonyms
- `POST /api/produce-synonyms` - Add new synonyms (Admin)
- `GET /api/produce-synonyms/search` - Search produce synonyms
- `GET /api/produce-synonyms/canonical` - Find canonical name
- `DELETE /api/produce-synonyms/:canonicalName` - Deactivate synonym (Admin)

## 5. Quality Assessment
- `POST /api/quality/ai-assessment` - Create AI assessment (Admin)
- `POST /api/quality/inspection` - Create inspection assessment (Inspector)
- `GET /api/quality/produce/:produce_id` - Get assessments by produce
- `GET /api/quality/produce/:produce_id/latest` - Get latest assessment
- `GET /api/quality/produce/:produce_id/latest-manual` - Get latest manual assessment

## 6. Inspections
- `POST /api/inspections/request` - Request inspection
- `GET /api/inspections/by-produce/:produce_id` - Get inspections by produce
- `GET /api/inspections/by-requester` - Get inspections by requester
- `GET /api/inspections/by-inspector` - Get inspections by inspector
- `PUT /api/inspections/:id/assign` - Assign inspector

## 7. Inspection Fees
- `PUT /api/inspection-fees/base-fee` - Update base fee (Admin)
- `PUT /api/inspection-fees/distance-fee` - Update distance fee (Admin)

## 8. Offers
- `POST /api/offers` - Create offer
- `GET /api/offers` - Get all offers
- `GET /api/offers/:id` - Get offer by ID
- `POST /api/offers/:id/reject` - Reject offer
- `POST /api/offers/:id/cancel` - Cancel offer
- `DELETE /api/offers/:id` - Delete offer

## 9. Daily Prices
- `POST /api/daily-prices` - Create daily price
- `GET /api/daily-prices/active` - Get active prices
- `GET /api/daily-prices/active/:category` - Get active price by category
- `PUT /api/daily-prices/:id` - Update daily price
- `DELETE /api/daily-prices/:id` - Deactivate daily price

## 10. Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions/:id/start-delivery` - Start delivery window
- `POST /api/transactions/:id/confirm-delivery` - Confirm delivery
- `POST /api/transactions/:id/confirm-inspection` - Confirm inspection
- `POST /api/transactions/:id/complete` - Complete transaction
- `POST /api/transactions/:id/reactivate` - Reactivate expired transaction
- `POST /api/transactions/:id/cancel` - Cancel transaction

## 11. Ratings
- `POST /api/ratings` - Create rating
- `GET /api/ratings/received` - Get received ratings
- `GET /api/ratings/given` - Get given ratings
- `GET /api/ratings/:id` - Get rating by ID
- `DELETE /api/ratings/:id` - Delete rating
- `GET /api/ratings/transaction/:transactionId` - Get ratings by transaction

## 12. Media
- `POST /api/media/upload` - Upload media file
- `GET /api/media/:id` - Get media by ID
- `DELETE /api/media/:id` - Delete media
- `GET /api/media/by-entity/:entity_id` - Get media by entity
- `GET /api/media/by-category/:category` - Get media by category

## 13. Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/:id/mark-read` - Mark notification as read

## 14. Support
- `POST /api/support` - Create support ticket
- `GET /api/support` - Get all tickets
- `GET /api/support/my-tickets` - Get user's tickets
- `GET /api/support/:id` - Get ticket by ID

## 15. Reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report by ID
- `GET /api/reports` - Get user reports
- `GET /api/reports/types` - Get report types
- `GET /api/reports/formats` - Get report formats

## 16. Metrics (Admin)
- `GET /api/metrics/dashboard` - Get dashboard metrics
- `GET /api/metrics/performance` - Get performance metrics
- `GET /api/metrics/daily-prices` - Get daily prices
- `GET /api/metrics/hourly-distribution` - Get hourly distribution
- `GET /api/metrics/top-users` - Get top users

## 17. Business Metrics
- `GET /api/metrics/error-rates` - Get error rates by path
- `GET /api/metrics/response-times` - Get response time percentiles
- `GET /api/metrics/daily-prices` - Get daily price trends
- `GET /api/metrics/hourly-distribution` - Get hourly activity distribution
- `GET /api/metrics/top-users` - Get top performing users

## 18. System Configuration
- `GET /api/config/system` - Get system configuration
- `PUT /api/config/system` - Update system configuration
- `GET /api/config/fees` - Get fee configuration
- `PUT /api/config/fees` - Update fee configuration

## 19. Fee Configuration
- `GET /api/config/inspection-fees` - Get base fee configuration
- `PUT /api/config/inspection-fees` - Update base fee configuration
- `GET /api/config/inspection-distance-fees` - Get distance fee configuration
- `PUT /api/config/inspection-distance-fees` - Update distance fee configuration

## 20. File Upload
- `POST /api/upload` - Upload file
- `POST /api/upload/multiple` - Upload multiple files

## 21. Farmers
- `POST /api/farmers` - Create farmer profile
- `GET /api/farmers/profile` - Get farmer profile
- `GET /api/farmers/nearby` - Find nearby farmers
- `POST /api/farmers/farms` - Add farm
- `PATCH /api/farmers/farms/:farmId` - Update farm

## 22. Buyers
- `POST /api/buyers/profile` - Create buyer profile
- `GET /api/buyers/profile` - Get buyer profile
- `GET /api/buyers/:id` - Get buyer by ID
- `GET /api/buyers/nearby` - Find nearby buyers
- `GET /api/buyers/details` - Get buyer details

## 23. Buyer Prices
- `POST /api/buyer-prices/price-change` - Handle price change (Buyer)

## 24. Admin
- `POST /api/admin/users/:id/block` - Block user
- `POST /api/admin/users/:id/unblock` - Unblock user
- `POST /api/admin/produce/:id/delete` - Delete produce
- `POST /api/admin/offers/:id/cancel` - Cancel offer
- `POST /api/admin/transactions/:id/cancel` - Cancel transaction
- `POST /api/admin/produce/:id/assign-inspector` - Assign inspector
- `POST /api/admin/system/config` - Update system config
- `GET /api/admin/system/config` - Get system config
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/stats/*` - Various statistics endpoints 