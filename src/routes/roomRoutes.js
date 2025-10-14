const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const authMiddleware = require('../middleware/authMiddleWare');

router.get("/", roomController.getAllRoomsByBoardingHouse);
router.get("/:id", roomController.getRoomById);
router.post("/:boardingHouseId/rooms", authMiddleware, roomController.addRoomsToBoardingHouse);
router.put("/:id", authMiddleware, roomController.updateRoom);
router.delete("/:id", authMiddleware, roomController.deleteRoom);

module.exports = router;