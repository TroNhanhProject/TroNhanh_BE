const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleWare");

router.post("/", authMiddleware, reportController.createReport);
router.get("/my-reports", authMiddleware, reportController.getMyReports);
router.get('/owners', authMiddleware, reportController.getOwners);
router.get('/check-history',authMiddleware,reportController.checkBookingHistory);
module.exports = router;