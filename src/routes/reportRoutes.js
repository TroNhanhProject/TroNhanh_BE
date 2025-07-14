// file TroNhanh_BE/src/routes/reportRoutes.js

const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// ✅ Route tạo mới report
router.post("/", reportController.createReport);

// ✅ Route lấy danh sách report theo reporterId (đã đúng)
router.get("/", reportController.getReportsByUser);

module.exports = router;
