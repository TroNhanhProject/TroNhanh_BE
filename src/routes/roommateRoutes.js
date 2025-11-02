// routes/roommateRoutes.js
const express = require('express');
const router = express.Router();
const { createPost, getPostsByAccommodation } = require('../controllers/roommateController');
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/', authMiddleware, createPost);
router.get('/:boardingHouseId', getPostsByAccommodation);

module.exports = router;
