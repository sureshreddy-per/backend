# Inspector API Examples

## Inspector API Documentation

### Authentication
All endpoints require JWT authentication and INSPECTOR role.

### Inspector Management
- `GET /inspectors/profile` - Get current inspector's profile
- `PATCH /inspectors/profile` - Update inspector's profile
- `GET /inspectors/nearby` - Find nearby inspectors (Query params: lat, lng, radius)

### Inspection Management
- `POST /inspection` - Create a new inspection (Body: produceId, method)
- `GET /inspection/my-inspections` - Get inspections performed by authenticated inspector
- `GET /inspection/:id` - Get inspection details
- `PUT /inspection/:id` - Update inspection details

### Quality Assessment
- `POST /quality` - Create quality assessment
- `GET /quality/:id` - Get quality assessment details

### System Monitoring
- `GET /monitoring/health` - Get system health status
- `GET /monitoring/metrics` - Get system metrics (Query params: duration)
- `GET /monitoring/performance` - Get performance statistics
- `GET /monitoring/errors` - Get error statistics
- `GET /monitoring/config` - Get current monitoring configuration

### Support
- `POST /support` - Create support ticket
- `GET /support/my-tickets` - Get authenticated user's support tickets (Query params: page, limit)
- `GET /support/:id` - Get support ticket details
- `DELETE /support/:id` - Delete support ticket

### Notifications
- `GET /notifications` - Get unread notifications
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `POST /notifications/:id/mark-read` - Mark notification as read

### Reports
- `GET /reports` - Get all reports
- `GET /reports/:id` - Get report details
- `POST /reports/generate` - Generate a new report
- `GET /reports/types` - Get available report types
- `GET /reports/formats` - Get available report formats