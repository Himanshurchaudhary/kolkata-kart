// routes/sellerRoutes.js

const express   = require("express");
const router    = express.Router();
const multer    = require("multer");
const jwt       = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

// ── Cloudinary (disk storage wala multer + compress helpers) ──────
const { upload, compressAndUpload, compressAndUploadFields } = require("../config/cloudinary");

const {
  sendOtp, verifyOtp, registerSeller, loginSeller,
  getProfile, updateProfile, updateProfilePic, getSellerOrders,
} = require("../controllers/Sellercontroller");

const {
  addSellerProduct, getMyProducts, getMyProductById,
} = require("../controllers/sellerProductController");

const { getSellerWallet } = require("../controllers/sellerWalletController");

// ── Multer error handler ───────────────────────────────────────────
const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 30 MB." });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  if (err?.message) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// ── Rate limiters ─────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many OTP requests. Please try again after 15 minutes." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

// ── JWT Auth Middleware ────────────────────────────────────────────
const authSeller = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.sellerId  = decoded.sellerId;
    req.email     = decoded.email;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token has expired" });
    }
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// ════════════════════════════════════════════════════════════════
// Public Routes
// ════════════════════════════════════════════════════════════════
router.post("/send-otp",   otpLimiter,  sendOtp);
router.post("/verify-otp",              verifyOtp);

// PAN card — sirf disk pe save, Cloudinary compress nahi (document hai)
router.post(
  "/register",
  upload.single("panCardImage"),
  handleMulterError,
  registerSeller
);

router.post("/login", loginLimiter, loginSeller);

// ════════════════════════════════════════════════════════════════
// Protected Routes
// ════════════════════════════════════════════════════════════════

// ── Profile ───────────────────────────────────────────────────────
router.get("/profile", authSeller, getProfile);
router.put("/profile", authSeller, updateProfile);

// ── Profile Pic — compress + Cloudinary ──────────────────────────
router.post(
  "/profile/pic",
  authSeller,
  ...compressAndUpload("profilePic", "ReadyGrocery/Sellers/ProfilePics"),
  updateProfilePic
);

// ── Orders & Wallet ───────────────────────────────────────────────
router.get("/orders", authSeller, getSellerOrders);
router.get("/wallet", authSeller, getSellerWallet);

// ── Products — compress + Cloudinary ─────────────────────────────
router.post(
  "/products/add",
  authSeller,
  ...compressAndUploadFields(
    [
      { name: "thumbnail",        maxCount: 1 },
      { name: "additionalImages", maxCount: 4 },
    ],
    "ReadyGrocery/Sellers/Products"
  ),
  addSellerProduct
);

router.get("/products",     authSeller, getMyProducts);
router.get("/products/:id", authSeller, getMyProductById);

module.exports = router;