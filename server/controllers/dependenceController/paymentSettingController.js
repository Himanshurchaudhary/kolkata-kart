const PaymentSetting = require('../../models/dependence/PaymentSetting');
const Razorpay       = require('razorpay');
const crypto         = require('crypto');

const ALLOWED_GATEWAYS = ['Stripe', 'Razorpay'];

exports.getAllGatewaySettings = async (req, res) => {
    try {
        const all      = await PaymentSetting.find();
        const settings = all.filter(s => ALLOWED_GATEWAYS.includes(s.gatewayName));
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.addPaymentSettings = async (req, res) => {
    try {
        const { gatewayName, status, mode, secretKey, publishedKey, title } = req.body;

        if (!ALLOWED_GATEWAYS.includes(gatewayName)) {
            return res.status(400).json({
                success: false,
                message: `Only Stripe and Razorpay are supported.`
            });
        }

        const exists = await PaymentSetting.findOne({ gatewayName });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: `${gatewayName} settings already exist. Use the update endpoint.`
            });
        }

        const logoUrl    = req.file ? req.file.path : null;
        const newSetting = await PaymentSetting.create({
            gatewayName,
            status: status === 'true' || status === true ? 1 : 0,  // ✅ MySQL boolean
            mode:   mode || 'Test',
            secretKey,
            publishedKey,
            title:  title || gatewayName,
            logo:   logoUrl,
        });

        res.status(201).json({
            success: true,
            message: `${gatewayName} added successfully!`,
            data:    newSetting
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updatePaymentSettings = async (req, res) => {
    try {
        const { gatewayName, status, mode, secretKey, publishedKey, title } = req.body;

        if (!ALLOWED_GATEWAYS.includes(gatewayName)) {
            return res.status(400).json({
                success: false,
                message: `Only Stripe and Razorpay are supported.`
            });
        }

        const updateFields = {
            status:       status === 'true' || status === true ? 1 : 0,  // ✅ MySQL boolean
            mode,
            secretKey,
            publishedKey,
            title,
        };
        if (req.file) updateFields.logo = req.file.path;

        const settings = await PaymentSetting.findOneAndUpdate({ gatewayName }, updateFields);

        res.status(200).json({
            success:  true,
            message:  `${gatewayName} settings updated successfully!`,
            settings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleGatewayStatus = async (req, res) => {
    try {
        const { gatewayName } = req.params;

        const updated = await PaymentSetting.toggleStatus(gatewayName);
        if (!updated) {
            return res.status(404).json({ success: false, message: `${gatewayName} not found` });
        }

        res.status(200).json({
            success: true,
            message: `${gatewayName} is now ${updated.status ? 'Active' : 'Inactive'}`,
            status:  updated.status
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getActiveGateways = async (req, res) => {
    try {
        // ✅ status = 1 (MySQL boolean fix)
        const gateways = await PaymentSetting.find({ status: 1 }, ['secretKey']);
        res.status(200).json({ success: true, gateways });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || amount < 1) {
            return res.status(400).json({ success: false, message: 'Invalid Amount' });
        }

        // ✅ status: 1 — MySQL boolean fix
        const config = await PaymentSetting.findOne({ gatewayName: 'Razorpay', status: 1 });
        if (!config) {
            return res.status(400).json({ success: false, message: 'Razorpay is disabled or not configured.' });
        }

        // ✅ Keys present hain ki nahi check karo
        if (!config.publishedKey || !config.secretKey) {
            return res.status(400).json({ success: false, message: 'Razorpay keys missing in DB.' });
        }

        const instance = new Razorpay({
            key_id:     config.publishedKey,
            key_secret: config.secretKey,
        });

        const options = {
            amount:   Math.round(amount * 100),
            currency: 'INR',
            receipt:  `receipt_${orderId || Date.now()}`,
            notes: {
                userId:  req.user?.id?.toString() || 'Guest',
                orderId: orderId,
            }
        };

        const rzpOrder = await instance.orders.create(options);

        res.status(200).json({
            success:  true,
            order_id: rzpOrder.id,
            amount:   rzpOrder.amount,
            key_id:   config.publishedKey,
        });
    } catch (error) {
        console.error('Razorpay processPayment error:', error); // ✅ Debug log
        res.status(500).json({ success: false, message: 'Payment could not be initiated', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // ✅ status check hataya — verify ke liye sirf keys chahiye
        const config = await PaymentSetting.findOne({ gatewayName: 'Razorpay' });
        if (!config) {
            return res.status(400).json({ success: false, message: 'Gateway settings not found' });
        }

        const sign         = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSign = crypto
            .createHmac('sha256', config.secretKey)
            .update(sign)
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ success: true, message: 'Payment verified successfully!' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid signature. Payment could not be verified.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};