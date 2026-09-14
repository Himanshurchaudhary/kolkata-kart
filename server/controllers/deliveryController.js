const DeliveryCharge = require('../models/DeliveryCharge');

// @desc Add New Delivery Charge
exports.addDeliveryCharge = async (req, res) => {
    try {
        const { minOrderAmount, maxOrderAmount, charge } = req.body;

        if (!minOrderAmount || !maxOrderAmount || !charge) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (Number(minOrderAmount) >= Number(maxOrderAmount)) {
            return res.status(400).json({
                success: false,
                message: 'Maximum order amount must be greater than minimum order amount'
            });
        }

        const newCharge = await DeliveryCharge.create({
            minOrderAmount: Number(minOrderAmount),
            maxOrderAmount: Number(maxOrderAmount),
            charge:         Number(charge)
        });

        res.status(201).json({
            success: true,
            message: 'Delivery charge added successfully',
            data: newCharge
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Get All Delivery Charges
exports.getAllCharges = async (req, res) => {
    try {
        const charges = await DeliveryCharge.find();
        res.status(200).json({ success: true, charges });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Get Single Delivery Charge by ID
exports.getDeliveryChargeById = async (req, res) => {
    try {
        const charge = await DeliveryCharge.findById(req.params.id);
        if (!charge) {
            return res.status(404).json({ success: false, message: 'Delivery charge not found' });
        }
        res.status(200).json({ success: true, data: charge });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Update Delivery Charge
exports.updateDeliveryCharge = async (req, res) => {
    try {
        const { minOrderAmount, maxOrderAmount, charge } = req.body;

        const existing = await DeliveryCharge.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Delivery charge not found' });
        }

        const newMin = minOrderAmount !== undefined ? Number(minOrderAmount) : existing.minOrderAmount;
        const newMax = maxOrderAmount !== undefined ? Number(maxOrderAmount) : existing.maxOrderAmount;

        if (newMin >= newMax) {
            return res.status(400).json({
                success: false,
                message: 'Maximum order amount must be greater than minimum order amount'
            });
        }

        const updateData = {};
        if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount);
        if (maxOrderAmount !== undefined) updateData.maxOrderAmount = Number(maxOrderAmount);
        if (charge         !== undefined) updateData.charge         = Number(charge);

        const updated = await DeliveryCharge.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            success: true,
            message: 'Delivery charge updated successfully',
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Delete Delivery Charge
exports.deleteDeliveryCharge = async (req, res) => {
    try {
        const deleted = await DeliveryCharge.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Delivery charge not found' });
        }
        res.status(200).json({ success: true, message: 'Delivery charge deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc Get Charge For a Specific Order Amount
exports.getChargeForAmount = async (req, res) => {
    try {
        const amount = Number(req.query.amount) || 0;

        if (amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        const result = await DeliveryCharge.findForAmount(amount);

        res.json({
            success: true,
            charge: result?.charge ?? 0
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};