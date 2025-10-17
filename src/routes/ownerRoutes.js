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

// file: src/routes/ownerRoutes.js

const express = require('express');
const router = express.Router();
const { getOwnerContractTemplate, createOrUpdateContractTemplate } = require('../controllers/contractController');
// ✅ IMPORT MIDDLEWARE XÁC THỰC CỦA BẠN
const authMiddleware = require('../middleware/authMiddleWare');

router.get('/contract-template', authMiddleware, getOwnerContractTemplate);
router.post('/contract-template', authMiddleware, createOrUpdateContractTemplate);

// router.get('/statistics', authMiddleware, ownerStatsController.getStatistics);

module.exports = router;