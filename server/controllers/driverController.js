const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const sendSms = require('../utils/sendSms');
const { pool } = require('../config/db');
const sendNotification = require('../utils/sendNotification');
const { driverWelcomeEmail, orderStatusEmail } = require('../utils/emailTemplates');
const fireAndForget = require('../utils/fireAndForget');
const Razorpay = require('razorpay');



// ─── Onboard New Driver ───────────────────────────────────────────────────────
exports.createDriver = async (req, res) => {
    try {
        const {
            fullName, email, phone,
            vehicleType, vehicleNumber,
            identityType, identityNumber,
            drivingLicense, gender, dob, password,
        } = req.body;

        const profileImage = req.file ? req.file.path : null;

        // ── Duplicate check ───────────────────────────────────────────────
        const orConditions = [];
        if (email)         orConditions.push({ email });
        if (phone)         orConditions.push({ phone });
        if (vehicleNumber) orConditions.push({ vehicleNumber });

        if (orConditions.length > 0) {
            const driverExists = await Driver.findOne({ $or: orConditions });
            if (driverExists) {
                return res.status(400).json({ success: false, message: 'Driver or Vehicle already registered' });
            }
        }

        const driver = await Driver.create({
            fullName, email, phone,
            vehicleType, vehicleNumber,
            identityType, identityNumber,
            drivingLicense, gender,
            dateOfBirth: dob ?? null,
            password:    password ?? null,
            profileImage,
        });

        // ── Respond immediately ───────────────────────────────────────────
        res.status(201).json({
            success: true,
            message: 'Driver onboarded successfully! Login credentials sent via SMS.',
            driver,
        });

        // ── Background: Welcome SMS + email notification ──────────────────
        fireAndForget(
            (async () => {
                // SMS: Welcome + Login Credentials
                if (phone && password) {
                    const smsMessage =
                        `Welcome to GraminKart, ${fullName}!\n\n` +
                        `Your driver account is ready.\n\n` +
                        `Login Credentials:\n` +
                        `  Mobile  : ${phone}\n` +
                        `  Password: ${password}\n\n` +
                        `Keep your credentials safe.\n` +
                        `– GraminKart Team`;
                    await sendSms(phone, smsMessage);
                }

                // Email notification
                if (email) {
                    const message =
                        `Welcome to GraminKart, ${fullName}!\n\n` +
                        `Login Credentials:\n  Mobile: ${phone}\n  Password: ${password}\n\n– GraminKart Team`;
                    const { subject, html } = driverWelcomeEmail(fullName, phone, password);
                    await sendNotification({ phone, email, subject, message, html });
                }
            })(),
            'create-driver-notifications'
        );

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Driver or Vehicle already registered' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};


// ─── Get Single Driver by ID ──────────────────────────────────────────────────
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        res.status(200).json({ success: true, driver });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// ─── Update Driver by ID ──────────────────────────────────────────────────────
exports.updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const {
            fullName, email, phone,
            vehicleType, vehicleNumber,
            identityType, identityNumber,
            drivingLicense, gender,
            dob, dateOfBirth,
            password,
        } = req.body;

        // ── Uniqueness checks ─────────────────────────────────────────────
        if (email && email !== driver.email) {
            const [exists] = await pool.query(
                `SELECT id FROM drivers WHERE email = ? AND id != ? LIMIT 1`,
                [email, req.params.id]
            );
            if (exists.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }
        if (phone && phone !== driver.phone) {
            const [exists] = await pool.query(
                `SELECT id FROM drivers WHERE phone = ? AND id != ? LIMIT 1`,
                [phone, req.params.id]
            );
            if (exists.length > 0) {
                return res.status(400).json({ success: false, message: 'Phone already in use' });
            }
        }
        if (vehicleNumber && vehicleNumber !== driver.vehicleNumber) {
            const [exists] = await pool.query(
                `SELECT id FROM drivers WHERE vehicleNumber = ? AND id != ? LIMIT 1`,
                [vehicleNumber, req.params.id]
            );
            if (exists.length > 0) {
                return res.status(400).json({ success: false, message: 'Vehicle number already registered' });
            }
        }

        // ── Build update payload ──────────────────────────────────────────
        const updateData = {};
        if (fullName)       updateData.fullName       = fullName;
        if (email)          updateData.email          = email;
        if (phone)          updateData.phone          = phone;
        if (vehicleType)    updateData.vehicleType    = vehicleType;
        if (vehicleNumber)  updateData.vehicleNumber  = vehicleNumber;
        if (identityType)   updateData.identityType   = identityType;
        if (identityNumber) updateData.identityNumber = identityNumber;
        if (drivingLicense) updateData.drivingLicense = drivingLicense;
        if (gender)         updateData.gender         = gender;
        if (password)       updateData.password       = password;
        const dobValue = dob || dateOfBirth;
        if (dobValue)       updateData.dateOfBirth    = dobValue;
        if (req.file)       updateData.profileImage   = req.file.path;

        const updated = await Driver.findByIdAndUpdate(req.params.id, updateData);

        // ── Respond immediately ───────────────────────────────────────────
        res.status(200).json({ success: true, message: 'Driver updated successfully!', driver: updated });

        // ── Background: SMS if password was changed ───────────────────────
        if (password && driver.phone) {
            fireAndForget(
                (async () => {
                    const message =
                        `Hello ${driver.fullName}!\n\n` +
                        `Your GraminKart driver account has been updated.\n` +
                        `New Password: ${password}\n\n` +
                        `If you did not request this change, contact support immediately.\n` +
                        `– GraminKart Team`;
                    await sendSms(driver.phone, message);
                })(),
                'update-driver-sms'
            );
        }

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// ─── Toggle Driver Online/Offline ─────────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
    try {
        const driver = await Driver.toggleOnline(req.params.id);
        if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
        res.status(200).json({ success: true, isOnline: driver.isOnline });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// ─── Get All Drivers (with optional filters) ──────────────────────────────────
exports.getAllDrivers = async (req, res) => {
    try {
        const { status, vehicle } = req.query;
        const filters = {};
        if (status)  filters.isOnline    = status === 'online' ? 1 : 0;
        if (vehicle) filters.vehicleType = vehicle;

        const drivers = await Driver.find(filters);
        res.status(200).json({ success: true, count: drivers.length, drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── Driver Login ─────────────────────────────────────────────────────────────
exports.loginDriver = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const driver = await Driver.findOne({ email, isActive: 1 });
        if (!driver || driver.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: driver.id, role: 'driver' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            driver: {
                id:            driver.id,
                fullName:      driver.fullName,
                email:         driver.email,
                phone:         driver.phone,
                vehicleType:   driver.vehicleType,
                vehicleNumber: driver.vehicleNumber,
                profileImage:  driver.profileImage,
                isOnline:      driver.isOnline,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Get Driver's Own Orders ──────────────────────────────────────────────────
exports.getDriverOrders = async (req, res) => {
    try {
        const orders = await Order.findByDriver(req.driver.id);
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Get Single Order for Driver ──────────────────────────────────────────────
exports.getDriverOrderById = async (req, res) => {
    try {
        const order = await Order.findByDriverAndId(req.driver.id, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Mark Order as Delivered ──────────────────────────────────────────────────
exports.markDelivered = async (req, res) => {
    try {
        const order = await Order.findByDriverAndId(req.driver.id, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!['On The Way', 'Shipped', 'Processing'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot deliver an order with status: ${order.status}`,
            });
        }

        const proofImage = req.file ? req.file.path : null;
        if (!proofImage) {
            return res.status(400).json({ success: false, message: 'Delivery proof photo is required' });
        }

        const isCOD = order.paymentMethod === 'COD';

        // For COD: status = Delivered but paymentStatus stays Pending (driver must collect)
        // For prepaid: status = Delivered and paymentStatus = Paid immediately
        const updateData = {
            status:        'Delivered',
            deliveredAt:   new Date(),
            deliveryProof: proofImage,
        };

        if (!isCOD) {
            // Prepaid (Razorpay/Card) — already paid at checkout
            updateData.paymentStatus = 'Paid';
            await Driver.findByIdAndUpdate(req.driver.id, { $inc: { totalOrdersDelivered: 1 } });
        }
        // COD: leave paymentStatus as-is (Pending), driver will call confirmPayment next

        await Order.findByIdAndUpdate(req.params.id, updateData);
        await Order.pushStatusHistory(req.params.id, 'Delivered');

        const updated = await Order.findByDriverAndId(req.driver.id, req.params.id);

        res.json({
            success: true,
            message: isCOD
                ? 'Order marked as delivered. Please collect payment from customer.'
                : 'Order delivered and marked as paid!',
            order: updated,
            requiresPaymentCollection: isCOD,
        });

        // Background: notify customer
        fireAndForget(
            (async () => {
                const customerPhone = order.shippingAddress?.phone;
                const customerName  = order.shippingAddress?.name;
                const customerEmail = order.shippingAddress?.email;
                const { subject, html } = orderStatusEmail(customerName || 'Customer', order.id, 'Delivered');
                const message =
                    `Hello ${customerName || 'Customer'}!\n\n` +
                    `Your order #${order.id} has been delivered successfully.\n\n` +
                    `Thank you for shopping with GraminKart!\n– GraminKart Team`;
                await sendNotification({ phone: customerPhone, email: customerEmail, subject, message, html });
                if (customerPhone) await sendSms(customerPhone, message);
            })(),
            'mark-delivered-notifications'
        );

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Confirm Pickup ───────────────────────────────────────────────────────────
exports.confirmPickup = async (req, res) => {
    try {
        const order = await Order.findByDriverAndId(req.driver.id, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!['Processing', 'Shipped'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm pickup for order with status: ${order.status}`,
            });
        }

        const pickupProof = req.file ? req.file.path : null;
        if (!pickupProof) {
            return res.status(400).json({ success: false, message: 'Pickup proof photo is required' });
        }

        await Order.findByIdAndUpdate(req.params.id, {
            status:     'Picked Up',
            pickupProof,
            pickedUpAt: new Date(),
        });
        await Order.pushStatusHistory(req.params.id, 'Picked Up');

        const updated = await Order.findByDriverAndId(req.driver.id, req.params.id);

        // ── Respond immediately ───────────────────────────────────────────
        res.json({ success: true, message: 'Pickup confirmed!', order: updated });

        // ── Background: notify customer ───────────────────────────────────
        // FIX: customerPhone/customerName/customerEmail were used before being declared
        fireAndForget(
            (async () => {
                const customerPhone = order.shippingAddress?.phone;
                const customerName  = order.shippingAddress?.name;
                const customerEmail = order.shippingAddress?.email;

                const driver = await Driver.findById(req.driver.id);

                // Email + push notification
                const { subject, html } = orderStatusEmail(customerName || 'Customer', order.id, 'Picked Up');
                const message =
                    `Hello ${customerName || 'Customer'}!\n\n` +
                    `Your order #${order.id} has been picked up by our driver.\n` +
                    `Driver : ${driver?.fullName || 'Our Driver'}\n` +
                    `Phone  : ${driver?.phone || ''}\n\n` +
                    `Your order is on its way!\n` +
                    `– GraminKart Team`;
                await sendNotification({ phone: customerPhone, email: customerEmail, subject, message, html });

                // SMS
                if (customerPhone) {
                    await sendSms(customerPhone, message);
                }
            })(),
            'confirm-pickup-notifications'
        );

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Update Order Status (driver-controlled stages) ───────────────────────────
exports.updateDriverOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ALLOWED = ['Picked Up', 'In Transit', 'On The Way', 'Delivered'];
        const progression = ['Shipped', 'Picked Up', 'In Transit', 'On The Way', 'Delivered'];


        if (!ALLOWED.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
        }

        const order = await Order.findByDriverAndId(req.driver.id, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // ── Enforce forward-only progression ─────────────────────────────
        const currentIdx  = progression.indexOf(order.status);
        const newIdx      = progression.indexOf(status);

        if (newIdx <= currentIdx) {
            return res.status(400).json({ success: false, message: 'Cannot move order backwards in status' });
        }

        const updateData = { status };
        if (status === 'Delivered') {
            updateData.deliveredAt   = new Date();
            updateData.paymentStatus = 'Paid';
        }

        await Order.findByIdAndUpdate(req.params.id, updateData);
        await Order.pushStatusHistory(req.params.id, status);

        const updated = await Order.findByDriverAndId(req.driver.id, req.params.id);

        // ── Respond immediately ───────────────────────────────────────────
        res.json({ success: true, message: `Status updated to ${status}`, order: updated });

        // ── Background: notify customer ───────────────────────────────────
        // FIX: customerPhone/customerName/customerEmail were used before being declared
        fireAndForget(
            (async () => {
                const customerPhone = order.shippingAddress?.phone;
                const customerName  = order.shippingAddress?.name;
                const customerEmail = order.shippingAddress?.email;

                const statusMessages = {
                    'Picked Up'  : `Your order #${order.id} has been picked up by our driver.`,
                    'In Transit' : `Your order #${order.id} is in transit and heading your way.`,
                    'On The Way' : `Your order #${order.id} is almost there! Driver is on the way.`,
                    'Delivered'  : `Your order #${order.id} has been delivered successfully. Thank you!`,
                };

                const message =
                    `Hello ${customerName || 'Customer'}!\n\n` +
                    (statusMessages[status] || `Your order #${order.id} status: ${status}`) +
                    `\n\n– GraminKart Team`;

                // Email + push notification
                const { subject, html } = orderStatusEmail(customerName || 'Customer', order.id, status);
                await sendNotification({ phone: customerPhone, email: customerEmail, subject, message, html });

                // SMS
                if (customerPhone) {
                    await sendSms(customerPhone, message);
                }
            })(),
            'driver-status-update-notifications'
        );

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Confirm COD Payment Collection ──────────────────────────────────────────
// Called after delivery for COD orders to record how payment was collected
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentMode, razorpayOrderId, razorpayPaymentId } = req.body;

        if (!['Cash', 'Online'].includes(paymentMode)) {
            return res.status(400).json({ success: false, message: 'paymentMode must be Cash or Online' });
        }

        const order = await Order.findByDriverAndId(req.driver.id, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Payment can only be confirmed for delivered orders' });
        }
        if (order.paymentStatus === 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment already confirmed' });
        }
        if (order.paymentMethod !== 'COD') {
            return res.status(400).json({ success: false, message: 'Payment confirmation is only for COD orders' });
        }
        if (paymentMode === 'Online' && (!razorpayOrderId || !razorpayPaymentId)) {
            return res.status(400).json({ success: false, message: 'razorpayOrderId and razorpayPaymentId required for online payment' });
        }

        // ── Save codPaymentMode alongside payment confirmation ────────────
        const updateData = {
            paymentStatus:  'Paid',
            codPaymentMode: paymentMode,   // ← 'Cash' or 'Online'
        };
        if (razorpayOrderId)   updateData.razorpayOrderId   = razorpayOrderId;
        if (razorpayPaymentId) updateData.razorpayPaymentId = razorpayPaymentId;

        await Order.findByIdAndUpdate(req.params.id, updateData);
        await Order.pushStatusHistory(
            req.params.id,
            'Delivered',
            `COD payment collected via ${paymentMode}`
        );

        await Driver.findByIdAndUpdate(req.driver.id, { $inc: { totalOrdersDelivered: 1 } });

        const updated = await Order.findByDriverAndId(req.driver.id, req.params.id);

        res.json({
            success: true,
            message: `Payment of ₹${order.total} collected via ${paymentMode}. Order fully completed!`,
            order:   updated,
        });

        fireAndForget(
            (async () => {
                const customerPhone = order.shippingAddress?.phone;
                const customerName  = order.shippingAddress?.name;
                const customerEmail = order.shippingAddress?.email;
                const message =
                    `Hello ${customerName || 'Customer'}!\n\n` +
                    `Payment of ₹${order.total} for order #${order.id} received via ${paymentMode}.\n` +
                    `Thank you for shopping with GraminKart!\n– GraminKart Team`;
                await sendNotification({ phone: customerPhone, email: customerEmail, subject: 'Payment Received', message, html: message });
                if (customerPhone) await sendSms(customerPhone, message);
            })(),
            'confirm-payment-notifications'
        );

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Init Razorpay for COD collection (mirrors processPayment exactly) ────────
exports.initCODPayment = async (req, res) => {
    try {
        const order = await Order.findByDriverAndId(req.driver.id, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentMethod !== 'COD') {
            return res.status(400).json({ success: false, message: 'Not a COD order' });
        }
        if (order.paymentStatus === 'Paid') {
            return res.status(400).json({ success: false, message: 'Already paid' });
        }

        // ── Same DB lookup processPayment uses ────────────────────────────
        const PaymentSetting = require('../models/dependence/PaymentSetting');
        const Razorpay       = require('razorpay');

        const config = await PaymentSetting.findOne({ gatewayName: 'Razorpay', status: true });
        if (!config) {
            return res.status(400).json({ success: false, message: 'Razorpay is disabled or not configured.' });
        }

        // ── Same instance pattern processPayment uses ─────────────────────
        const instance = new Razorpay({
            key_id:     config.publishedKey,
            key_secret: config.secretKey,
        });

        const rzpOrder = await instance.orders.create({
            amount:   Math.round(order.total * 100),
            currency: 'INR',
            receipt:  `cod_${order.id}_${Date.now()}`,
            notes: {
                driverId: req.driver.id.toString(),
                orderId:  order.id.toString(),
            },
        });

        // ── Same response shape processPayment returns ────────────────────
        res.status(200).json({
            success:  true,
            order_id: rzpOrder.id,
            amount:   rzpOrder.amount,
            key_id:   config.publishedKey,  // ← publishedKey, not env var
        });

    } catch (err) {
        console.error('[initCODPayment]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Verify Razorpay for COD collection (mirrors verifyPayment exactly) ───────
exports.verifyCODPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // ── Same DB lookup verifyPayment uses ─────────────────────────────
        const PaymentSetting = require('../models/dependence/PaymentSetting');
        const crypto         = require('crypto');

        const config = await PaymentSetting.findOne({ gatewayName: 'Razorpay' });
        if (!config) {
            return res.status(400).json({ success: false, message: 'Gateway settings not found' });
        }

        // ── Same signature check verifyPayment uses ───────────────────────
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

    } catch (err) {
        console.error('[verifyCODPayment]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};