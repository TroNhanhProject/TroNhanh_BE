// routes/roommateRoutes.js
const express = require('express');
const router = express.Router();
const { createPost, getPostsByAccommodation, getAllPosts } = require('../controllers/roommateController');
const authMiddleware = require('../middleware/authMiddleWare');
const upload = require('../middleware/roommateUpload');

// Accept up to 6 images in the `images` field (multipart/form-data)
router.post('/', authMiddleware, upload.array('images', 6), createPost);
router.get('/:boardingHouseId', getPostsByAccommodation);
router.get('/', getAllPosts);

module.exports = router;
