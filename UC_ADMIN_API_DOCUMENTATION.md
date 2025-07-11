# Admin User Management API Documentation

## Overview
This API implements all UC-Admin use cases with complete business rule compliance for TroNhanh application.

## Business Rules Implementation

### UC-Admin-01: View User List
- **BR-VUL-01**: Pagination limit - Default 20 users/page, max 50
- **BR-VUL-02**: Role filtering - Filter by admin, owner, customer
- **BR-VUL-03**: Search capability - Search by name, email, phone
- **BR-VUL-04**: Account status display - Shows locked users with status
- **BR-VUL-05**: Real-time updates - Live data retrieval

### UC-Admin-02: Lock/Unlock User
- **BR-LOA-01**: Admin authorization - Only admins can lock/unlock
- **BR-LOA-02**: Self-lock prevention - Cannot lock own admin account
- **BR-LOA-03**: Access denial - Locked accounts cannot login
- **BR-LOA-04**: Data retention - Locked accounts retain all data
- **BR-LOA-05**: Action logging - All lock/unlock actions logged

### UC-Admin-03: Edit User Information
- **BR-EAI-01**: Edit authorization - Only admins can edit
- **BR-EAI-02**: Input validation - Email format, non-empty names
- **BR-EAI-03**: Unique information - Email/phone uniqueness check
- **BR-EAI-04**: Real-time sync - Immediate data synchronization
- **BR-EAI-05**: Edit logging - All changes logged with before/after

### UC-Admin-04: Delete User Account
- **BR-DUA-01**: Dependency check - Cannot delete users with active payments
- **BR-DUA-02**: Delete confirmation - Requires explicit "DELETE" confirmation
- **BR-DUA-03**: Soft delete - Marks as deleted, doesn't remove from DB
- **BR-DUA-04**: Login restriction - Deleted accounts cannot login
- **BR-DUA-05**: Delete logging - Detailed deletion logging

## API Endpoints

### 1. View User List
**GET** `/api/admin/users`

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20, max: 50)
role: string (admin|owner|customer)
status: string (active|inactive|banned)
gender: string (male|female|other)
search: string (searches name, email, phone)
sortBy: string (default: createdAt)
sortOrder: string (asc|desc, default: desc)
```

**Example Request:**
```
GET /api/admin/users?page=1&limit=20&role=customer&status=active&search=john
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "user_id",
        "role": "customer",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "gender": "male",
        "avatar": "",
        "status": "active",
        "isDeleted": false,
        "createdAt": "2025-07-07T00:00:00.000Z",
        "updatedAt": "2025-07-07T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalUsers": 100,
      "newUsersLast30Days": 15,
      "byRole": { "customer": 70, "owner": 25, "admin": 5 },
      "byStatus": { "active": 90, "inactive": 8, "banned": 2 },
      "byGender": { "male": 45, "female": 40, "other": 15 }
    },
    "filters": {
      "role": "customer",
      "status": "active",
      "search": "john"
    }
  }
}
```

### 2. Lock/Unlock User
**PUT** `/api/admin/users/:id/lock-unlock`

**Request Body:**
```json
{
  "action": "lock"  // or "unlock"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User locked successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "banned"
  }
}
```

**Error Cases:**
- Self-lock attempt: `400 - Cannot lock your own admin account`
- Invalid action: `400 - Invalid action. Must be "lock" or "unlock"`
- User not found: `404 - User not found`

### 3. Edit User Information
**PUT** `/api/admin/users/:id/edit`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "0987654321",
  "gender": "male",
  "role": "owner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User information updated successfully",
  "data": {
    "_id": "user_id",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "phone": "0987654321",
    "gender": "male",
    "role": "owner",
    "status": "active"
  }
}
```

**Validation Errors:**
- Empty name: `400 - Name cannot be empty`
- Invalid email: `400 - Invalid email format`
- Duplicate email: `400 - Email already exists`
- Duplicate phone: `400 - Phone number already exists`
- No changes: `400 - No changes detected`

### 4. Delete User Account
**DELETE** `/api/admin/users/:id`

**Request Body:**
```json
{
  "confirm": "DELETE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User account deleted successfully (soft delete)",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "inactive",
    "isDeleted": true,
    "deletedAt": "2025-07-07T12:00:00.000Z"
  }
}
```

**Error Cases:**
- Missing confirmation: `400 - Delete confirmation required`
- Active payments: `400 - Cannot delete user with active payments`
- User not found: `404 - User not found`

### 5. Get User by ID
**GET** `/api/admin/users/:id`

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "status": "active"
  }
}
```

### 6. Get User Statistics
**GET** `/api/admin/users/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "newUsersLast30Days": 15,
    "byRole": { "customer": 70, "owner": 25, "admin": 5 },
    "byStatus": { "active": 90, "inactive": 8, "banned": 2 },
    "byGender": { "male": 45, "female": 40, "other": 15 }
  }
}
```

### 7. Get Audit Logs
**GET** `/api/admin/audit-logs`

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20)
action: string (VIEW_USER_LIST|LOCK_USER|UNLOCK_USER|EDIT_USER|DELETE_USER)
adminId: string (ObjectId)
targetUserId: string (ObjectId)
startDate: string (ISO date)
endDate: string (ISO date)
```

**Response:**
```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": {
    "logs": [
      {
        "_id": "log_id",
        "adminId": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "admin"
        },
        "action": "LOCK_USER",
        "targetUserId": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "customer"
        },
        "description": "Locked user: john@example.com",
        "oldData": { "status": "active" },
        "newData": { "status": "banned" },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2025-07-07T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalLogs": 200,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Authentication & Authorization

All admin endpoints require:
1. Valid JWT token in Authorization header: `Bearer <token>`
2. User role must be 'admin'
3. User status must be 'active'

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Testing Examples

### Test Lock User
```bash
curl -X PUT "http://localhost:3000/api/admin/users/USER_ID/lock-unlock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "lock"}'
```

### Test Edit User
```bash
curl -X PUT "http://localhost:3000/api/admin/users/USER_ID/edit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "New Name", "email": "newemail@example.com"}'
```

### Test Delete User
```bash
curl -X DELETE "http://localhost:3000/api/admin/users/USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"confirm": "DELETE"}'
```

## Database Schema Updates

### User Model Additions:
- `isDeleted: Boolean` (default: false)
- `deletedAt: Date` (default: null)

### New AuditLog Model:
- Tracks all admin actions with full context
- Stores old/new data for changes
- Records IP address and user agent
- Indexed for performance

## Security Features

1. **Action Logging**: All admin actions logged with full audit trail
2. **Self-Protection**: Admins cannot lock themselves
3. **Soft Delete**: No data loss, reversible deletions
4. **Dependency Checks**: Prevents deletion of users with active data
5. **Input Validation**: Comprehensive validation for all inputs
6. **Unique Constraints**: Email/phone uniqueness enforced
