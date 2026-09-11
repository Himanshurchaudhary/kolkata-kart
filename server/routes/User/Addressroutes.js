const express         = require('express');
const router          = express.Router();
const { protectUser } = require('../../middleware/authMiddleware');
const User            = require('../../models/User/User');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanBody = ({ name, phone, altPhone, pincode, state, city, house, road, landmark, type, isDefault }) => ({
    name:      (name      || '').trim(),
    phone:     (phone     || '').trim(),
    altPhone:  (altPhone  || '').trim(),
    pincode:   (pincode   || '').trim(),
    state:     (state     || '').trim(),
    city:      (city      || '').trim(),
    house:     (house     || '').trim(),
    road:      (road      || '').trim(),
    landmark:  (landmark  || '').trim(),
    type:      type      || 'Home',
    isDefault: Boolean(isDefault),
});

const validateAddress = ({ name, phone, pincode, state, city, house, road }) => {
    if (!name)    return 'Name is required';
    if (!phone)   return 'Phone number is required';
    if (!pincode) return 'Pincode is required';
    if (!state)   return 'State is required';
    if (!city)    return 'City is required';
    if (!house)   return 'House / Building is required';
    if (!road)    return 'Road / Area is required';
    return null;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// ⚠️  IMPORTANT: /check-pincode ko sabse upar rakhna zaroori hai.
//     Agar neeche rakha toh Express isse /:id samajh leta aur galat route match hota.

// GET /api/address/check-pincode?pincode=800001
// Public route — login ki zaroorat nahi
router.get('/check-pincode', async (req, res) => {
    try {
        const { pincode } = req.query;

        // Basic validation
        if (!pincode || pincode.trim().length !== 6 || !/^\d{6}$/.test(pincode.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Valid 6-digit numeric pincode required',
            });
        }

        const result = await User.checkPincode(pincode);

        if (result) {
            return res.json({
                success:     true,
                deliverable: true,
                pincode:     result.pincode,
                city:        result.city,
                state:       result.state,
                message:     `Delivery available in ${result.city}, ${result.state}`,
            });
        }

        return res.json({
            success:     true,
            deliverable: false,
            message:     'Sorry, we do not deliver to this pincode yet',
        });

    } catch (err) {
        console.error('[GET /api/address/check-pincode]', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/address — logged-in user ki saari addresses
router.get('/', protectUser, async (req, res) => {
    try {
        const addresses = await User.getAddresses(req.user.id);
        res.json({ success: true, addresses });
    } catch (err) {
        console.error('[GET /api/address]', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/address — nayi address add karo
router.post('/', protectUser, async (req, res) => {
    try {
        const data  = cleanBody(req.body);
        const error = validateAddress(data);
        if (error) return res.status(400).json({ success: false, message: error });

        // Pincode serviceability check
        const serviceable = await User.checkPincode(data.pincode);
        if (!serviceable) {
            return res.status(400).json({
                success:     false,
                deliverable: false,
                message:     `Sorry, we do not deliver to pincode ${data.pincode} yet`,
            });
        }

        const addresses = await User.addAddress(req.user.id, data);
        res.status(201).json({ success: true, message: 'Address added successfully', addresses });
    } catch (err) {
        console.error('[POST /api/address]', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/address/:id — existing address update karo
router.put('/:id', protectUser, async (req, res) => {
    try {
        const data  = cleanBody(req.body);
        const error = validateAddress(data);
        if (error) return res.status(400).json({ success: false, message: error });

        // Pincode serviceability check
        const serviceable = await User.checkPincode(data.pincode);
        if (!serviceable) {
            return res.status(400).json({
                success:     false,
                deliverable: false,
                message:     `Sorry, we do not deliver to pincode ${data.pincode} yet`,
            });
        }

        const addresses = await User.updateAddress(req.user.id, req.params.id, data);
        if (!addresses) return res.status(404).json({ success: false, message: 'Address not found' });

        res.json({ success: true, message: 'Address updated successfully', addresses });
    } catch (err) {
        console.error('[PUT /api/address/:id]', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/address/:id — address delete karo
router.delete('/:id', protectUser, async (req, res) => {
    try {
        const addresses = await User.deleteAddress(req.user.id, req.params.id);
        if (!addresses) return res.status(404).json({ success: false, message: 'Address not found' });

        res.json({ success: true, message: 'Address removed successfully', addresses });
    } catch (err) {
        console.error('[DELETE /api/address/:id]', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/address/:id/set-default — default address set karo
router.patch('/:id/set-default', protectUser, async (req, res) => {
    try {
        const addresses = await User.setDefaultAddress(req.user.id, req.params.id);
        if (!addresses) return res.status(404).json({ success: false, message: 'Address not found' });

        res.json({ success: true, message: 'Default address updated', addresses });
    } catch (err) {
        console.error('[PATCH /api/address/:id/set-default]', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;