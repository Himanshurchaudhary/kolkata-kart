const express         = require('express');
const router          = express.Router();
const ComboWishlist   = require('../../models/User/ComboWishlist');
const { protectUser } = require('../../middleware/authMiddleware');

// GET /api/combo-wishlist
router.get('/', protectUser, async (req, res) => {
    try {
        const data = await ComboWishlist.findByUser(req.user.id);
        res.json(data);
    } catch (err) {
        console.error('GET /api/combo-wishlist error:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/combo-wishlist/add
router.post('/add', protectUser, async (req, res) => {
    try {
        const { comboId } = req.body;
        if (!comboId) return res.status(400).json({ message: 'comboId is required' });

        const data = await ComboWishlist.add(req.user.id, comboId);
        res.json(data);
    } catch (err) {
        console.error('POST /api/combo-wishlist/add error:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/combo-wishlist/remove/:comboId
router.delete('/remove/:comboId', protectUser, async (req, res) => {
    try {
        const data = await ComboWishlist.remove(req.user.id, req.params.comboId);
        res.json(data);
    } catch (err) {
        console.error('DELETE /api/combo-wishlist/remove error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;