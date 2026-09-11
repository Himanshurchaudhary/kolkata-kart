const express = require('express');
const router = express.Router();
const { compressAndUpload } = require('../config/cloudinary');
const {
    addAd,
    getAllAds,
    getActiveAds,
    getAdById,
    updateAd,
    toggleAdStatus,
    deleteAd
} = require('../controllers/adController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public
router.get('/active', getActiveAds);

// Admin protected
router.get('/', getAllAds);
router.post('/add', protect, ...compressAndUpload('image', 'ReadyGrocery/Ads'), addAd);

router.get('/:id', getAdById);
router.put('/:id', ...compressAndUpload('image', 'ReadyGrocery/Ads'), updateAd);
router.patch('/:id/toggle', toggleAdStatus);
router.delete('/:id', deleteAd);

module.exports = router;