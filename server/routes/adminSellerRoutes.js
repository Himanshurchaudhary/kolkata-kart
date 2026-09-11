// routes/adminSellerRoutes.js
// Mount in app.js: app.use("/api/admin", adminSellerRoutes)

const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const {
  getAllSellers,
  getSellerById,
  updateSellerStatus,
} = require("../controllers/adminSellerController");
const { protect, isAdmin } = require('../middleware/authMiddleware');


// ── Admin JWT middleware ───────────────────────────────────────────


// ── Routes ────────────────────────────────────────────────────────
router.get   ("/sellers",     protect, getAllSellers);
router.get   ("/sellers/:id", protect, getSellerById);
router.patch ("/sellers/:id", protect, updateSellerStatus);

module.exports = router;