// routes/user.routes.js
const express = require('express');
const router  = express.Router();
const upload = require('../../config/cloudinary');

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,   // ← add
  resetPassword,    // ← add
} = require('../../controllers/User/UserController');

const { protectUser } = require('../../middleware/authMiddleware');


// ── Public Routes ────────────────────────────────────
router.post('/register',        register);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);   // ← add
router.post('/reset-password',  resetPassword);    // ← add


// ── Protected Routes (JWT required) ─────────────────
router.get('/me',              protectUser, getMe);
router.put('/update-profile',  protectUser, upload.single('image'), updateProfile);
router.put('/change-password', protectUser, changePassword);


module.exports = router;