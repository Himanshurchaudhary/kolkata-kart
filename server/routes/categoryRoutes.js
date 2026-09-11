const express = require('express');
const router = express.Router();
const { compressAndUpload } = require('../config/cloudinary');  // ← CHANGE
const { addCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController/categoryController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/add', ...compressAndUpload('thumbnail', 'ReadyGrocery/Categories'), protect, addCategory);  // ← CHANGE

router.get('/all', getCategories);

router.put('/:id', protect, ...compressAndUpload('thumbnail', 'ReadyGrocery/Categories'), updateCategory);  // ← CHANGE

router.delete('/:id', protect, deleteCategory);

module.exports = router;