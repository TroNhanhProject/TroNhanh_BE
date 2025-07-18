const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/",authMiddleware, reportController.createReport);
router.get('/owners',authMiddleware,reportController.getOwners);

module.exports = router;