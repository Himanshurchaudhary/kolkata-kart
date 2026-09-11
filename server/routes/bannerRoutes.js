const express = require('express');
const router = express.Router();
const { compressAndUpload } = require('../config/cloudinary');  // ← LINE 3 CHANGE
const { addBanner, getBanners, deleteBanner } = require('../controllers/Apperance/bannerController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/list', getBanners);   

router.post('/add', protect, isAdmin, ...compressAndUpload('bannerImage', 'ReadyGrocery/Banners'), addBanner);  // ← LINE 11 CHANGE
router.get('/list', protect, isAdmin, getBanners);
router.delete('/:id', protect, isAdmin, deleteBanner);
router.get('/list', getBanners);

module.exports = router;