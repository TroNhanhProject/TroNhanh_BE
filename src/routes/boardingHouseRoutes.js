const express = require("express");
const router = express.Router();
const boardingHouseController = require("../controllers/boardingHouseController");
const uploadAccommodation = require("../middleware/accommodationUpload");
const searchAc = require("../controllers/searchAccomodation");
const authMiddleware = require('../middleware/authMiddleWare');



router.get("/", boardingHouseController.getAllBoardingHouses);
router.get("/searchBoardingHouse", searchAc.SearchBoardingHouseNoUsingAI);
router.get("/:id", boardingHouseController.getBoardingHouseById);



router.post(
  "/:id/reviews",
  authMiddleware,
  boardingHouseController.submitReview
);

router.put(
  "/:id/reviews/:reviewId",
  authMiddleware,
  boardingHouseController.editReview
);

router.delete(
  "/:id/reviews/:reviewId",
  authMiddleware,
  boardingHouseController.deleteReview
);
router.delete("/:id", boardingHouseController.deleteBoardingHouse);


router.post("/", uploadAccommodation.array("photos", 10), boardingHouseController.createBoardingHouse);
router.put("/:id", uploadAccommodation.array("photos", 10), boardingHouseController.updateBoardingHouse);

// Owner rating routes
router.get("/owner/ratings", authMiddleware, boardingHouseController.getOwnerBoardingHousesWithRatings);
router.get("/owner/:id/ratings", authMiddleware, boardingHouseController.getBoardingHouseRatingsForOwner);

// Owner statistics routes
router.get("/owner/statistics", authMiddleware, boardingHouseController.getOwnerStatistics);
router.get("/owner/monthly-revenue", authMiddleware, boardingHouseController.getOwnerMonthlyRevenue);
router.get("/owner/recent-bookings", authMiddleware, boardingHouseController.getOwnerRecentBookings);
router.get("/owner/top-accommodations", authMiddleware, boardingHouseController.getOwnerTopAccommodations);
router.get("/owner/current-membership", authMiddleware, boardingHouseController.getOwnerCurrentMembership);
router.get("/owner/membership-info", authMiddleware, boardingHouseController.getOwnerMembershipInfo);

module.exports = router;