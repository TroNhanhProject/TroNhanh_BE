// // file: TroNhanh_BE/src/routes/membershipRoutes.js
// const express = require('express');
// const router = express.Router();

// const { adminAuth } = require('../middleware/adminAuth');
// router.use(adminAuth);

// const { createPaymentUrl, vnpayReturn } = require('../controllers/vnpayController');
// const { getPublicMembershipPackages } = require('../controllers/AdminController/MembershipController');
// const { getCurrentMembershipOfUser } = require('../controllers/paymentController');

// // route to get public membership packages
// router.get('/membership-packages', (req, res) => {
//     // console.log("🔥 Route /api/membership-packages hit");
//     getPublicMembershipPackages(req, res);
// });

// router.post('/create', createPaymentUrl);
// router.get('/vnpay_return', vnpayReturn);
// router.get('/current/:userId', getCurrentMembershipOfUser); 

// // --- CONTRACT ROUTES FOR OWNER ---
// router.post('/contract-template', contractController.createOrUpdateContractTemplate);
// router.get('/contract-template', contractController.getOwnerContractTemplate);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { getOwnerContractTemplate, createOrUpdateContractTemplate } = require('../controllers/contractController');
const { getOwnerNotifications, markNotificationAsRead } = require('../controllers/NotificationController');
const { getPendingBookings, updateBookingApproval } = require('../controllers/bookingController');
// ✅ IMPORT MIDDLEWARE XÁC THỰC CỦA BẠN
const authMiddleware = require('../middleware/authMiddleware');

router.get('/contract-template', authMiddleware, getOwnerContractTemplate);
router.post('/contract-template', authMiddleware, createOrUpdateContractTemplate);

// router.get('/statistics', authMiddleware, ownerStatsController.getStatistics);

router.get('/bookings/pending', authMiddleware, getPendingBookings);
router.put('/bookings/:bookingId/approval', authMiddleware, updateBookingApproval);


router.get('/notifications', authMiddleware, getOwnerNotifications);
router.put('/notifications/:notificationId/read', authMiddleware, markNotificationAsRead);

module.exports = router;