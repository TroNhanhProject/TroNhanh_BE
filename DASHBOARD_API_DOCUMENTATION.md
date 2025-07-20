# Admin Dashboard API Documentation

## Overview
The Admin Dashboard provides comprehensive analytics and metrics for the TroNhanh platform through 5 separate APIs. Each API focuses on a specific domain for better performance and modularity.

## Authentication
All dashboard APIs require admin authentication:
- Headers: `Authorization: Bearer <admin_token>`
- Middleware: `adminAuth` (validates JWT token + admin role)

## API Endpoints

### 1. Dashboard Overview
**UC-Admin-Dashboard-Overview: Get basic overview metrics**

```
GET /api/admin/dashboard/overview
```

**Query Parameters:**
- `period` (number, default: 30) - Number of days for historical data analysis

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalCustomers": 800,
    "totalOwners": 400,
    "blockedUsers": 70,
    "totalAccommodations": 485,
    "totalRevenue": 125000000,
    "pendingReports": 8,
    "totalMembershipPackages": 5,
    "period": {
      "days": 30,
      "startDate": "2025-06-19T10:00:00.000Z",
      "endDate": "2025-07-19T10:00:00.000Z"
    }
  },
  "message": "Dashboard overview retrieved successfully"
}
```

### 2. User Analytics Dashboard
**UC-Admin-Dashboard-Users: Get detailed user statistics**

```
GET /api/admin/dashboard/users
```

**Query Parameters:**
- `period` (number, default: 30) - Number of days for analysis

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "customerCount": 800,
    "ownerCount": 400,
    "blockedCount": 70,
    "newUsers": 45,
    "growthRate": "3.60",
    "roleBreakdown": {
      "customer": 800,
      "owner": 400,
      "admin": 50
    },
    "statusBreakdown": {
      "active": 1180,
      "locked": 70
    },
    "membershipBreakdown": {
      "premium": 200,
      "basic": 150,
      "none": 900
    },
    "dailyRegistrations": [
      { "date": "2025-07-15", "count": 8 },
      { "date": "2025-07-16", "count": 12 }
    ],
    "topUsers": [
      {
        "_id": "user_id",
        "name": "Top Owner",
        "email": "owner@example.com",
        "accommodationCount": 15,
        "membershipStatus": "premium"
      }
    ]
  },
  "message": "User dashboard data retrieved successfully"
}
```

### 3. Accommodation Analytics Dashboard
**UC-Admin-Dashboard-Accommodations: Get accommodation analytics**

```
GET /api/admin/dashboard/accommodations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 485,
    "newAccommodations": 28,
    "occupancyRate": "67.84",
    "statusBreakdown": {
      "Available": 315,
      "Unavailable": 170
    },
    "approvalBreakdown": {
      "approved": 420,
      "pending": 35,
      "rejected": 20,
      "deleted": 10
    },
    "priceStats": {
      "averagePrice": 2500000,
      "minPrice": 500000,
      "maxPrice": 15000000
    },
    "ownerWithMostPosts": [
      {
        "ownerId": "owner_id",
        "ownerName": "Top Owner",
        "ownerEmail": "owner@example.com",
        "totalPosts": 15,
        "pendingPosts": 2,
        "approvedPosts": 12,
        "rejectedPosts": 1,
        "deletedPosts": 0
      }
    ],
    "postStatusSummary": {
      "totalPosts": 485,
      "pendingPosts": 35,
      "approvedPosts": 420,
      "rejectedPosts": 20,
      "deletedPosts": 10
    }
  },
  "message": "Accommodation dashboard data retrieved successfully"
}
```

### 4. Report Analytics Dashboard
**UC-Admin-Dashboard-Reports: Get report analytics**

```
GET /api/admin/dashboard/reports
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 95,
    "recentReports": 12,
    "pendingCount": 8,
    "resolutionRate": "91.58",
    "statusBreakdown": {
      "Pending": 8,
      "Approved": 52,
      "Rejected": 35
    },
    "ownerReports": {
      "total": 25,
      "pending": 5,
      "approved": 15,
      "rejected": 5
    },
    "customerReports": {
      "total": 45,
      "pending": 8,
      "approved": 25,
      "rejected": 12
    },
    "topReportTypes": [
      { "type": "Inappropriate behavior", "count": 25 },
      { "type": "Property mismatch", "count": 18 }
    ]
  },
  "message": "Report dashboard data retrieved successfully"
}
```

### 5. Membership Analytics Dashboard
**UC-Admin-Dashboard-Memberships: Get membership analytics**

```
GET /api/admin/dashboard/memberships
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPackages": 5,
    "totalPurchases": 350,
    "recentPurchases": 25,
    "activePurchases": 145,
    "conversionRate": "70.00",
    "packagePopularity": [
      {
        "_id": "package_id",
        "packageName": "Premium Monthly",
        "packagePrice": 299000,
        "packageDuration": 30,
        "ownerPurchaseCount": 120,
        "totalRevenue": 35880000
      }
    ],
    "mostPopularPackage": {
      "_id": "package_id",
      "packageName": "Premium Monthly",
      "packagePrice": 299000,
      "packageDuration": 30,
      "ownerPurchaseCount": 120,
      "totalRevenue": 35880000
    }
  },
  "message": "Membership dashboard data retrieved successfully"
}
```

### 6. Financial Analytics Dashboard
**UC-Admin-Dashboard-Financial: Get detailed financial analytics**

```
GET /api/admin/dashboard/financial
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 1850,
    "recentTransactions": 125,
    "totalRevenue": 125000000,
    "recentRevenue": 8500000,
    "averageTransaction": 675675,
    "statusBreakdown": {
      "success": 1620,
      "pending": 85,
      "failed": 145
    },
    "dailyRevenue": [
      {
        "date": "2025-07-15",
        "revenue": 2500000,
        "count": 8
      }
    ],
    "monthlyRevenue": [
      {
        "period": "2025-07",
        "revenue": 8500000,
        "count": 125
      }
    ],
    "yearlyRevenue": [
      {
        "year": 2025,
        "revenue": 125000000,
        "count": 1850
      }
    ],
    "membershipRevenue": [
      {
        "_id": "package_id",
        "packageName": "Premium Monthly",
        "revenue": 45000000,
        "count": 120
      }
    ]
  },
  "message": "Financial dashboard data retrieved successfully"
}
```

## API Architecture

### Benefits of Separate APIs:
1. **Performance**: Each API loads only relevant data
2. **Modularity**: Frontend can load specific sections independently
3. **Scalability**: Individual APIs can be optimized separately
4. **Maintainability**: Easier to debug and update specific sections
5. **Caching**: Different cache strategies for different data types

### API Hierarchy:
```
/api/admin/dashboard/
├── overview           # Basic metrics summary
├── users             # User analytics & demographics
├── accommodations    # Property listings & owner stats
├── reports           # User reports & moderation
├── memberships       # Package sales & popularity
└── financial         # Revenue & transaction analytics
```

## Usage Examples

### Load Dashboard Overview Only:
```bash
GET /api/admin/dashboard/overview?period=7
```

### Load All User Analytics:
```bash
GET /api/admin/dashboard/users?period=30
```

### Load Financial Data for Last Quarter:
```bash
GET /api/admin/dashboard/financial?period=90
```

### Load Multiple Sections (Frontend):
```javascript
const dashboardData = await Promise.all([
  fetch('/api/admin/dashboard/overview'),
  fetch('/api/admin/dashboard/users'),
  fetch('/api/admin/dashboard/accommodations')
]);
```

## Performance Considerations

1. **Parallel Loading**: Frontend can load multiple sections simultaneously
2. **Selective Loading**: Load only needed sections based on user interaction
3. **Caching Strategy**: Different cache TTL for different data types
4. **Database Optimization**: Each API has optimized queries for its domain
5. **Progressive Loading**: Load overview first, then detailed sections

## Security & Access Control

- All APIs require admin authentication
- Consistent error handling across all endpoints
- Rate limiting applied per API endpoint
- Audit logging for dashboard access
- Data sanitization and validation

This modular approach provides better performance, maintainability, and user experience for the admin dashboard system.

## Dashboard Metrics Explanation

### User Metrics
- **Total Users**: All registered users across all roles
- **New Users**: Users registered within the specified period
- **Growth Rate**: Percentage growth of new users
- **Role Breakdown**: Distribution of users by role (customer, owner, admin)
- **Status Breakdown**: Distribution by account status (active, locked)
- **Membership Breakdown**: Distribution by membership status
- **Daily Registrations**: New user registrations over time
- **Top Users**: Most active users (owners with most accommodations)

### Accommodation Metrics
- **Total Accommodations**: All accommodation listings
- **New Accommodations**: Listings created within the period
- **Occupancy Rate**: Percentage of accommodations with active customers
- **Status Breakdown**: Distribution by availability status
- **Approval Breakdown**: Distribution by approval status
- **Price Statistics**: Average, minimum, and maximum prices

### Financial Metrics
- **Total Transactions**: All payment transactions ever processed
- **Recent Transactions**: Transactions within the specified period
- **Total Revenue**: Cumulative revenue from successful transactions
- **Recent Revenue**: Revenue generated within the period
- **Average Transaction**: Mean transaction amount
- **Status Breakdown**: Transaction success/failure rates
- **Daily Revenue**: Revenue trends over time
- **Membership Revenue**: Revenue breakdown by membership packages

### Report Metrics
- **Total Reports**: All user reports submitted
- **Recent Reports**: Reports submitted within the period
- **Pending Count**: Reports awaiting admin resolution
- **Resolution Rate**: Percentage of resolved reports
- **Status Breakdown**: Distribution by resolution status
- **Top Report Types**: Most common types of issues reported

### Membership Metrics
- **Total Packages**: Available membership packages
- **Total Purchases**: All membership purchases ever made
- **Recent Purchases**: Purchases within the period
- **Active Purchases**: Currently active memberships
- **Conversion Rate**: Purchase success rate
- **Package Popularity**: Most popular membership packages

### Platform Health
- **Health Score**: Overall platform health (0-100)
  - 80-100: Healthy (Green)
  - 60-79: Warning (Yellow)
  - 0-59: Critical (Red)
- **Active Users 24h**: Users active in last 24 hours
- **New Users 24h**: New registrations in last 24 hours
- **New Accommodations 24h**: New listings in last 24 hours
- **Pending Approvals**: Accommodations awaiting approval
- **Failed Transactions 24h**: Failed payments in last 24 hours
- **Critical Reports**: Pending reports older than 1 week

### Recent Activity
- Real-time feed of admin actions
- Shows recent audit log entries
- Includes admin details and target users
- Helps track administrative activities

## Usage Examples

### Example 1: Get Last 7 Days Overview
```bash
GET /api/admin/dashboard?period=7
```

### Example 2: Get Detailed User Analytics for Last Month
```bash
GET /api/admin/dashboard/users?period=30
```

### Example 3: Get Financial Performance for Last Quarter
```bash
GET /api/admin/dashboard/financial?period=90
```

## Business Intelligence Features

### Key Performance Indicators (KPIs)
1. **User Growth Rate**: Track platform adoption
2. **Occupancy Rate**: Measure accommodation utilization
3. **Revenue Growth**: Monitor financial performance
4. **Report Resolution Rate**: Track customer service efficiency
5. **Platform Health Score**: Overall system status

### Trend Analysis
- Daily registration trends
- Revenue growth patterns
- Report volume trends
- Membership adoption rates
- Accommodation listing trends

### Performance Monitoring
- Real-time health metrics
- Failed transaction monitoring
- Pending approval tracking
- Critical report alerts
- System performance indicators

## Security & Performance

### Data Protection
- Admin-only access with JWT validation
- Sensitive financial data properly formatted
- Personal user information excluded from aggregations
- Audit trail for all dashboard access

### Performance Optimization
- Parallel query execution for faster response
- Database indexing for aggregation queries
- Efficient pagination for large datasets
- Caching-ready response structure

### Error Handling
- Graceful degradation for missing data
- Comprehensive error logging
- Development vs production error details
- Fallback values for failed calculations

## Integration Notes

1. **Real-time Updates**: Dashboard data reflects current system state
2. **Cross-Module Analytics**: Combines data from all system modules
3. **Audit Integration**: Tracks dashboard access in audit logs
4. **Scalable Architecture**: Designed to handle growing data volumes
5. **Mobile-Ready**: Response format suitable for mobile dashboards

This comprehensive dashboard system provides administrators with deep insights into platform performance, user behavior, financial health, and operational metrics essential for effective platform management.
