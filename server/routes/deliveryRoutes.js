const express = require('express');
const router = express.Router();
const {
    addDeliveryCharge,
    getAllCharges,
    updateDeliveryCharge,
    deleteDeliveryCharge,
    getChargeForAmount          // ← updated
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add',              protect, addDeliveryCharge);
router.get('/all',               getAllCharges);                    // public for checkout
router.put('/update/:id',        protect, updateDeliveryCharge);
router.delete('/delete/:id',     protect, deleteDeliveryCharge);
router.get('/charge-for-amount', getChargeForAmount);              // ← updated

module.exports = router;