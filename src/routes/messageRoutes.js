const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.get("/conversations/:userId", messageController.getUserMessages);
router.post("/send", messageController.sendMessage);

module.exports = router;