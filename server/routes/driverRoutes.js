const express = require('express');
const router = express.Router();
// const upload = require('../config/cloudinary');
const { compressAndUpload } = require('../config/cloudinary');

const {
  createDriver,
  toggleStatus,
  getAllDrivers,
  getDriverById,
  updateDriver,
  loginDriver,
  getDriverOrders,
  getDriverOrderById,
  markDelivered,
  confirmPickup,           // ← ADD
  updateDriverOrderStatus, // ← ADD
  confirmPayment,
  initCODPayment,
  verifyCODPayment 
} = require('../controllers/driverController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { protectDriver } = require('../middleware/driverAuthMiddleware');

router.post('/login', loginDriver);
router.get('/my-orders',         protectDriver, getDriverOrders);
router.get('/my-orders/:id',     protectDriver, getDriverOrderById);
router.patch('/my-orders/:id/deliver', protectDriver, ...compressAndUpload('proofImage', 'ReadyGrocery/prrof'), markDelivered);  
router.patch('/my-orders/:id/pickup', protectDriver, ...compressAndUpload('pickupProof', 'ReadyGrocery/pickup'), confirmPickup);
router.patch('/my-orders/:id/status', protectDriver, updateDriverOrderStatus);

// Add Driver with Profile Image
router.post('/add', protect, ...compressAndUpload('profileImage', 'ReadyGrocery/profileimg'), createDriver);

// Get All Drivers
router.get('/all', protect, getAllDrivers);

// Get Single Driver by ID
router.get('/:id', protect, getDriverById);

// Update Driver by ID
router.put('/:id', protect, ...compressAndUpload('profileImage', 'ReadyGrocery/profileimg'), updateDriver);       //...compressAndUpload('proofImage', 'ReadyGrocery/prrof')

// Toggle Online/Offline Status
router.patch('/status/:id', protect, toggleStatus);

router.get('/my-orders',         protectDriver, getDriverOrders);
router.get('/my-orders/:id',     protectDriver, getDriverOrderById);
router.patch('/my-orders/:id/deliver', protectDriver, ...compressAndUpload('proofImage', 'ReadyGrocery/prrof'), markDelivered);     
router.patch('/my-orders/:id/confirm-payment', protectDriver, confirmPayment);
router.post('/my-orders/:id/payment-init',   protectDriver, initCODPayment);
router.post('/my-orders/:id/payment-verify', protectDriver, verifyCODPayment);

module.exports = router;