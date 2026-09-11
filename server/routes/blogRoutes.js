const express = require('express');
const router = express.Router();
const { compressAndUpload } = require('../config/cloudinary');  // ← CHANGE
const {
    addBlog, getAllBlogs, getBlogById,
    updateBlog, toggleBlogStatus, deleteBlog
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, ...compressAndUpload('thumbnail', 'ReadyGrocery/Blogs'), addBlog);          // ← CHANGE
router.get('/all', getAllBlogs);
router.get('/:id', getBlogById);
router.put('/update/:id', protect, ...compressAndUpload('thumbnail', 'ReadyGrocery/Blogs'), updateBlog); // ← CHANGE
router.patch('/toggle-status/:id', protect, toggleBlogStatus);
router.delete('/delete/:id', protect, deleteBlog);

module.exports = router;