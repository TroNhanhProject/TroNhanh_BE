
const express = require("express");
const { chat} = require("../controllers/aiController");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const router = express.Router();

router.post("/chat",optionalAuthMiddleware, chat);


module.exports = router; 
