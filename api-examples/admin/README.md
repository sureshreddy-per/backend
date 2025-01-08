# Admin API Examples

## Admin API Documentation

### Authentication
All endpoints require JWT authentication and ADMIN role.

### User Management
- `GET /users` - Get all users (Query params: page, limit)
- `GET /users/:id` - Get user details
- `PUT /users/:id/verify` - Verify user status
- `PUT /users/:id/roles` - Update user roles (Body: role, action: 'add' | 'remove')
- `PUT /users/:id/block` - Block user with reason
- `PUT /users/:id/unblock` - Unblock user

### System Configuration
- `POST /admin/system/config` - Update system configuration
- `GET /admin/system/config` - Get current system configuration

### Farmer Management
- `GET /farmers` - Get all farmers
- `GET /farmers/:id` - Get farmer details
- `DELETE /farmers/:id` - Delete farmer

### Buyer Management
- `GET /buyers` - Get all buyers
- `GET /buyers/:id` - Get buyer details
- `DELETE /buyers/:id` - Delete buyer

### Inspector Management
- `POST /inspectors` - Create a new inspector
- `GET /inspectors` - Get all inspectors
- `GET /inspectors/:id` - Get inspector details
- `PATCH /inspectors/:id` - Update inspector details
- `DELETE /inspectors/:id` - Delete inspector
- `POST /admin/produce/:id/assign-inspector` - Assign inspector to produce

### Produce Management
- `GET /produce` - Get all produce listings (Query params: farm_id, status, produce_category, page, limit)
- `GET /produce/:id` - Get produce details
- `POST /admin/produce/:id/delete` - Delete produce with reason

### Offer Management
- `GET /offers` - Get all offers
- `GET /offers/:id` - Get offer details
- `POST /admin/offers/:id/cancel` - Cancel offer with reason

### Transaction Management
- `POST /admin/transactions/:id/cancel` - Cancel transaction with reason

### Support Management
- `GET /support` - Get all support tickets (Query params: page, limit)
- `GET /support/:id` - Get support ticket details
- `DELETE /support/:id` - Delete support ticket

### Inspection Management
- `GET /inspection` - Get all inspections
- `GET /inspection/:id` - Get inspection details
- `DELETE /inspection/:id` - Delete inspection

### Audit & Monitoring
- `GET /admin/audit-logs` - Get audit logs (Query params: action, admin_id, entity_type, from_date, to_date, page, limit)
- `GET /admin/metrics` - Get system metrics
- `GET /admin/stats/users` - Get user statistics
- `GET /admin/stats/produce` - Get produce statistics
- `GET /admin/stats/transactions` - Get transaction statistics
- `GET /admin/stats/offers` - Get offer statistics
- `GET /admin/stats/system` - Get system performance statistics

### Auto-Offer Management
- `POST /auto-offers/produce` - Generate auto offers for produce
- `POST /auto-offers/buyer` - Generate auto offers for buyer