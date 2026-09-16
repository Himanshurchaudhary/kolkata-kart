// routes/sellerRoutes.js

const express   = require("express");
const router    = express.Router();
const multer    = require("multer");
const jwt       = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const {
  sendOtp,
  verifyOtp,
  registerSeller,
  loginSeller,
  getProfile,
  updateProfile,
  updateProfilePic,
    getSellerOrders,

} = require("../controllers/Sellercontroller");

const {
  addSellerProduct,
  getMyProducts,
  getMyProductById,
} = require("../controllers/sellerProductController");

const { getSellerWallet } = require("../controllers/sellerWalletController");
const { compressAndUpload, compressAndUploadFields } = require("../config/cloudinary");




// ── If you added getSellerOrders inside sellerProductController instead,
//    replace the above with:
//    const { addSellerProduct, getMyProducts, getMyProductById, getSellerOrders }
//      = require("../controllers/sellerProductController");

// ── Multer (memory storage — buffer goes directly to Cloudinary) ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ── Multer error handler middleware ────────────────────────────────
const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum allowed size is 2 MB." });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  if (err && err.message === "Only image files are allowed") {
    return res.status(400).json({ message: "Only image files (jpg, png, etc.) are allowed." });
  }
  next(err);
};

// ── Rate limiter for OTP endpoint ──────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests from this IP. Please try again after 15 minutes.",
  },
});

// ── Rate limiter for login endpoint ───────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts from this IP. Please try again after 15 minutes.",
  },
});

// ── JWT Auth Middleware ────────────────────────────────────────────
const authSeller = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
router.post("/send-otp",                                         sendOtp);
router.post("/verify-otp",                                                      verifyOtp);
router.post("/register",    upload.single("panCardImage"), handleMulterError,  registerSeller);
router.post("/login",                                           loginSeller);

// ════════════════════════════════════════════════════════════════
// Protected Routes
// ════════════════════════════════════════════════════════════════

// ── Profile ──────────────────────────────────────────────────────
router.get( "/profile",     authSeller,                                         getProfile);
router.put( "/profile",     authSeller,                                         updateProfile);
router.post("/profile/pic", authSeller, upload.single("profilePic"), handleMulterError, updateProfilePic);

// ── Orders (read-only for seller) ────────────────────────────────
router.get( "/orders",      authSeller,                                         getSellerOrders);
router.get("/wallet", authSeller, getSellerWallet);


// ── Products ─────────────────────────────────────────────────────
// router.post(
//   "/products/add",
//   authSeller,
//   upload.fields([
//     { name: "thumbnail",        maxCount: 1 },
//     { name: "additionalImages", maxCount: 4 },
//   ]),
//   handleMulterError,
//   addSellerProduct
// );

router.post(
  "/products/add",
  authSeller,
  ...compressAndUploadFields(
    [
      { name: "thumbnail",        maxCount: 1 },
      { name: "additionalImages", maxCount: 4 },
    ],
    "ReadyGrocery/Products"
  ),
  addSellerProduct
);


router.get("/products",     authSeller, getMyProducts);
router.get("/products/:id", authSeller, getMyProductById);

module.exports = router;