const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require('../middleware/authMiddleware');

router.post("/", authMiddleware, bookingController.createBooking);
router.put("/checkout/:bookingId", authMiddleware, bookingController.checkoutBooking);
router.post("/update-boarding-house", authMiddleware, bookingController.updateBoardingHouseAfterPayment);
router.get("/user/:userId/boarding-house/:boardingHouseId", authMiddleware, bookingController.getUserBookingForBoardingHouse);
router.get('/user/history', authMiddleware, bookingController.getUserBookingHistory);
router.get("/boarding-house/:boardingHouseId", authMiddleware, bookingController.getBookingsByBoardingHouse);

router.post('/request', authMiddleware, bookingController.requestBooking);
router.put('/:bookingId/cancel', authMiddleware, bookingController.cancelBookingRequest);

module.exports = router;