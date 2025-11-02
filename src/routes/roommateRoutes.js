// routes/roommateRoutes.js
const express = require('express');
const router = express.Router();
const { createPost, getPostsByAccommodation, getAllPosts } = require('../controllers/roommateController');
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/', authMiddleware, createPost);
router.get('/:boardingHouseId', getPostsByAccommodation);
router.get('/', getAllPosts);

module.exports = router;
