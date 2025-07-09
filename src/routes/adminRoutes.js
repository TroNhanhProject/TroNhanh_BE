const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserStats,
  getUserStatsEndpoint,
  getUserById,
  lockUnlockUser,
  editUserInfo,
  deleteUser,
  getAuditLogs
} = require('../controllers/AdminController/UserController');

// Import admin authentication middleware
const { adminAuth } = require('../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(adminAuth);

// UC-Admin-01: View User List
router.get('/users', getAllUsers);                    // GET /api/admin/users
router.get('/users/stats', getUserStatsEndpoint);    // GET /api/admin/users/stats

// UC-Admin-02: Lock/Unlock User
router.put('/users/:id/lock-unlock', lockUnlockUser); // PUT /api/admin/users/:id/lock-unlock

// UC-Admin-03: Edit User Information  
router.put('/users/:id/edit', editUserInfo);         // PUT /api/admin/users/:id/edit

// UC-Admin-04: Delete User Account
router.delete('/users/:id', deleteUser);             // DELETE /api/admin/users/:id

// Additional endpoints
router.get('/users/:id', getUserById);               // GET /api/admin/users/:id
router.get('/audit-logs', getAuditLogs);            // GET /api/admin/audit-logs

module.exports = router;