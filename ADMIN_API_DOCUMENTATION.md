# Admin API Documentation

## Overview
This document provides a comprehensive overview of all implemented admin APIs for the TroNhanh platform.

## Authentication
All admin APIs require authentication using JWT token and admin role verification.
- Headers: `Authorization: Bearer <token>`
- Middleware: `adminAuth` (combines authentication and admin role check)

## API Endpoints

### User Management (UserController)

#### 1. Get All Users
- **Endpoint**: `GET /api/admin/users`
- **Description**: Retrieve all users with pagination, filtering, and search
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `role` (string): Filter by role (customer, owner, admin)
  - `status` (string): Filter by status (active, locked)
  - `search` (string): Search by name or email
  - `sortBy` (string): Sort field (default: createdAt)
  - `sortOrder` (string): Sort order (asc/desc, default: desc)

#### 2. Get User Statistics
- **Endpoint**: `GET /api/admin/users/stats`
- **Description**: Get user statistics for dashboard

#### 3. Get User by ID
- **Endpoint**: `GET /api/admin/users/:id`
- **Description**: Get detailed user information

#### 4. Lock/Unlock User
- **Endpoint**: `PUT /api/admin/users/:id/lock-unlock`
- **Description**: Lock or unlock user account
- **Body**: `{ "action": "lock"|"unlock", "reason": "string" }`

#### 5. Edit User Information
- **Endpoint**: `PUT /api/admin/users/:id`
- **Description**: Edit user profile information
- **Body**: User fields to update

#### 6. Delete User
- **Endpoint**: `DELETE /api/admin/users/:id`
- **Description**: Soft delete user account
- **Body**: `{ "reason": "string" }`

#### 7. Get Audit Logs
- **Endpoint**: `GET /api/admin/audit-logs`
- **Description**: Retrieve admin action audit logs
- **Query Parameters**: Similar to users endpoint with additional filters

### Accommodation Management (AccommodationController)

#### 1. Get All Accommodations (Admin)
- **Endpoint**: `GET /api/admin/accommodations`
- **Description**: View all accommodation posts with admin-specific information
- **Query Parameters**:
  - `page`, `limit`: Pagination
  - `status`: Filter by status (active, inactive, pending, rejected)
  - `type`: Filter by accommodation type
  - `search`: Search in title or address
  - `ownerId`: Filter by owner
  - `sortBy`, `sortOrder`: Sorting options

#### 2. Get Accommodation Details (Admin)
- **Endpoint**: `GET /api/admin/accommodations/:id`
- **Description**: Get detailed accommodation information for admin review

#### 3. Approve/Reject Accommodation
- **Endpoint**: `PUT /api/admin/accommodations/:id/approve`
- **Description**: Approve or reject accommodation post
- **Body**: `{ "action": "approve"|"reject", "reason": "string" }`

#### 4. Delete Accommodation (Admin)
- **Endpoint**: `PUT /api/admin/accommodations/:id/delete`
- **Description**: Soft delete accommodation post
- **Body**: `{ "reason": "string" }`

### Membership Package Management (MembershipController)

#### 1. Create Membership Package
- **Endpoint**: `POST /api/admin/membership-packages`
- **Description**: Create new membership package
- **Body**: Package details including name, description, price, duration, features

#### 2. Get All Membership Packages
- **Endpoint**: `GET /api/admin/membership-packages`
- **Description**: List all membership packages
- **Query Parameters**: Standard pagination and filtering

#### 3. Get Membership Package by ID
- **Endpoint**: `GET /api/admin/membership-packages/:id`
- **Description**: Get detailed package information

#### 4. Update Membership Package
- **Endpoint**: `PUT /api/admin/membership-packages/:id`
- **Description**: Update existing membership package
- **Body**: Package fields to update

#### 5. Delete Membership Package
- **Endpoint**: `DELETE /api/admin/membership-packages/:id`
- **Description**: Soft delete membership package (sets isDeleted: true)

### Transaction History Management (TransactionController)

#### 1. Get Transaction History
- **Endpoint**: `GET /api/admin/transactions`
- **Description**: View all payment transactions with comprehensive filtering
- **Query Parameters**:
  - `page`, `limit`: Pagination
  - `status`: Filter by payment status
  - `ownerId`: Filter by specific owner
  - `membershipPackageId`: Filter by membership package
  - `startDate`, `endDate`: Date range filtering
  - `minAmount`, `maxAmount`: Amount range filtering
  - `search`: Search in VNPay transaction ID or order info
  - `sortBy`, `sortOrder`: Sorting options

#### 2. Get Transaction Statistics
- **Endpoint**: `GET /api/admin/transactions/stats`
- **Description**: Get transaction statistics for dashboard
- **Query Parameters**: Date range filters for statistics

#### 3. Get Transaction by ID
- **Endpoint**: `GET /api/admin/transactions/:id`
- **Description**: Get detailed transaction information

## Business Rules Compliance

### BR-CMP-01: Membership Package Information
- All membership packages include: package name, description, price, duration, features
- Packages support soft delete with isDeleted field

### BR-CMP-02: Purchase Tracking
- All membership purchases are tracked with buyer information
- Purchase history includes package details and transaction records

### BR-VTH-01: Transaction History Information
- Transaction records include: date, sender (owner), receiver (system), transaction type, amount
- Additional details: VNPay transaction ID, payment status, membership package info

### BR-VTH-02: Read-Only Access
- Transaction history is read-only for admin viewing
- No modification capabilities provided

### BR-VTH-03: Chronological Sorting
- Default sorting by transaction date in descending order (newest first)
- Supports custom sorting options

## Audit Logging
All admin actions are logged with:
- Admin user information
- Action type and timestamp
- Target resource details
- Action reason (where applicable)
- IP address and user agent

## Error Handling
All APIs implement consistent error handling with:
- HTTP status codes
- Structured error responses
- Validation error details
- User-friendly error messages

## Security Features
- JWT token validation
- Admin role verification
- Input sanitization and validation
- Audit trail for all admin actions
- Rate limiting and request validation

## Models Used
- **User**: User account management
- **Accommodation**: Property/room listings
- **MembershipPackage**: Subscription plans
- **MembershipPurchase**: Purchase tracking
- **Payment**: Transaction records
- **AuditLog**: Admin action logging

## Next Steps
The admin API suite is now complete and ready for testing. Consider implementing:
1. API rate limiting for admin endpoints
2. Enhanced reporting and analytics
3. Bulk operations for user and accommodation management
4. Advanced filtering and export capabilities
