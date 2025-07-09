# User Membership Feature Documentation

## Overview
Added `isMembership` field to User model to track user membership status.

## User Model Updates

### New Field: `isMembership`
- **Type**: String
- **Enum**: ['active', 'inactive', 'none']
- **Default**: 'none'
- **Description**: Tracks user's membership status

## API Updates

### 1. Get All Users (Updated)
**GET** `/api/admin/users`

**New Query Parameter:**
- `membership`: Filter by membership status (active|inactive|none)

**Example:**
```
GET /api/admin/users?membership=active&limit=10
```

### 2. Get User Statistics (Updated)
**GET** `/api/admin/users/stats`

**New Response Field:**
```json
{
  "data": {
    "byMembership": {
      "active": 15,
      "inactive": 5,
      "none": 80
    }
  }
}
```

### 3. Edit User Information (Updated)
**PUT** `/api/admin/users/:id/edit`

**New Request Body Field:**
```json
{
  "isMembership": "active"  // or "inactive" or "none"
}
```

**Validation:**
- Only accepts: 'active', 'inactive', 'none'
- Case insensitive (converts to lowercase)

**Example:**
```bash
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID/edit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"isMembership": "active"}'
```

## Database Schema Changes

### User Model
```javascript
isMembership: {
  type: String,
  enum: ['active', 'inactive', 'none'],
  default: 'none'
}
```

## Business Logic

### Membership States
1. **none**: Default state - user has no membership
2. **inactive**: User had membership but it's currently inactive
3. **active**: User has an active membership

### Admin Capabilities
- Filter users by membership status
- View membership statistics
- Edit user membership status
- All membership changes are logged in audit trail

## Test Cases

### Filter by Membership
```javascript
// Test active membership filter
GET /api/admin/users?membership=active

// Test inactive membership filter
GET /api/admin/users?membership=inactive

// Test no membership filter
GET /api/admin/users?membership=none
```

### Edit Membership
```javascript
// Activate membership
PUT /api/admin/users/:id/edit
Body: { "isMembership": "active" }

// Deactivate membership
PUT /api/admin/users/:id/edit
Body: { "isMembership": "inactive" }

// Remove membership
PUT /api/admin/users/:id/edit
Body: { "isMembership": "none" }
```

### Error Handling
```javascript
// Invalid membership status
PUT /api/admin/users/:id/edit
Body: { "isMembership": "invalid" }
// Returns: 400 - Invalid membership status
```

## Audit Trail
All membership changes are logged with:
- Old membership status
- New membership status
- Admin who made the change
- Timestamp and IP address

## Usage Examples

### Get users with active membership
```bash
curl -X GET "http://localhost:5000/api/admin/users?membership=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Change user to active membership
```bash
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID/edit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"isMembership": "active"}'
```

### View membership statistics
```bash
curl -X GET "http://localhost:5000/api/admin/users/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes
- Membership field is included in all user responses
- Changes are validated server-side
- All modifications are logged for audit purposes
- Field is searchable and filterable
- Default value is 'none' for new users
