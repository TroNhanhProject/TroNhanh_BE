const express = require("express");
const router = express.Router();
const accommodationController = require("../controllers/accommodationController");
const uploadAccommodation = require("../middleware/accommodationUpload");
const searchAc = require("../controllers/searchAccomodation");
const authMiddleware = require('../middleware/authMiddleWare');



router.get("/", accommodationController.getAllAccommodations);
router.get("/searchAccomodation", searchAc.SearchAccomodationNoUsingAI);
router.get("/:id", accommodationController.getAccommodationById);



router.post(
  "/:id/reviews",
  authMiddleware,
  accommodationController.submitReview
);

router.put(
  "/:id/reviews/:reviewId",
  authMiddleware,
  accommodationController.editReview
);

router.delete(
  "/:id/reviews/:reviewId",
  authMiddleware,
  accommodationController.deleteReview
);
router.delete("/:id", accommodationController.deleteAccommodation);


router.post("/", uploadAccommodation.array("photos", 10), accommodationController.createAccommodation);
router.put("/:id", uploadAccommodation.array("photos", 10), accommodationController.updateAccommodation);

module.exports = router;