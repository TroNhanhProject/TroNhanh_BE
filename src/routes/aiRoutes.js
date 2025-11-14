
const express = require("express");
const { chat, analyzeSentiment } = require("../controllers/aiController");

const router = express.Router();

router.post("/chat", chat);
router.post("/analyze-sentiment", analyzeSentiment);

module.exports = router; 
