const express = require('express');
const router  = express.Router();

const {
    addCombo, getAllCombos, getComboById,
    updateCombo, deleteCombo,
} = require('../controllers/Combocontroller');

const { compressAndUploadFields } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

const thumbnailUpload = compressAndUploadFields(
    [{ name: 'thumbnail', maxCount: 1 }],
    'ReadyGrocery/Combos'
);

router.post('/add',         protect, ...thumbnailUpload, addCombo);
router.get('/all',          protect, getAllCombos);
router.get('/allFree',              getAllCombos);
router.get('/free/:id',             getComboById);   // ← yeh add karo
router.get('/:id',          protect, getComboById);
router.put('/update/:id',   protect, ...thumbnailUpload, updateCombo);
router.delete('/delete/:id',protect, deleteCombo);

module.exports = router;