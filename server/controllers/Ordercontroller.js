const Order = require('../models/Order');
const Cart = require('../models/User/Cart');
const User = require('../models/User/User');
const Product = require('../models/product_Management/Product');
const ComboOffer = require('../models/Combooffer');
const sendSms = require('../utils/sendSms');
const { orderPlacedEmail, orderStatusEmail, riderAssignedEmail, driverAssignedEmail } = require('../utils/emailTemplates');
const sendNotification = require('../utils/sendNotification');
const fireAndForget = require('../utils/fireAndForget');
const SellerWalletModel = require("../models/SellerWallet");
const { pool } = require('../config/db');


// ─── Seller wallet credit ─────────────────────────────────────────────────────
const creditSellerWalletForOrder = async (orderId, status) => {
  if (!["Delivered", "Completed"].includes(status)) return;

  try {
    // ── Directly DB se seller_id nikalo ──────────────────────────────
    const [[sellerRow]] = await pool.query(`
      SELECT p.seller_id
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ? AND p.seller_id IS NOT NULL
      LIMIT 1
    `, [orderId]);

    if (!sellerRow?.seller_id) {
      console.warn("[Wallet] seller_id not found for order", orderId);
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) return;

    const commissionPct = Number(process.env.SELLER_COMMISSION_PERCENT || 10);

    const result = await SellerWalletModel.creditOrder({
      sellerId:     sellerRow.seller_id,
      orderId:      order.id,
      orderNumber:  order.orderNumber,
      orderTotal:   Number(order.total),
      commissionPct,
    });

    if (result.alreadyCredited) {
      console.log(`[Wallet] Order ${orderId} already credited`);
    } else {
      console.log(`[Wallet] Credited ₹${result.creditedAmt} to seller ${sellerRow.seller_id}`);
    }
  } catch (err) {
    console.error("[Wallet] creditSellerWalletForOrder error:", err.message);
  }
};

// ─── Snapshot Address ─────────────────────────────────────────────────────────
const snapshotAddress = (addr) => ({
    name: addr.name || '',
    phone: addr.phone || '',
    altPhone: addr.altPhone || '',
    house: addr.house || '',
    road: addr.road || '',
    city: addr.city || '',
    state: addr.state || '',
    pincode: addr.pincode || '',
    landmark: addr.landmark || '',
    type: addr.type || 'Home',
});


// ─── Combo helpers ────────────────────────────────────────────────────────────
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const httpError = (status, message) => Object.assign(new Error(message), { status });

// Combo ko product lines mein todta hai. Price hamesha DB ke comboPrice se aata hai.
// Lines ka total exactly comboPrice × qty hota hai (rounding ka fark aakhri line le leti hai).
const buildComboLines = (combo, qty) => {
    if (!combo || combo.status !== 'active') {
        throw httpError(404, 'This combo is no longer available.');
    }
    const now = Date.now();
    if (combo.startDate && new Date(combo.startDate).getTime() > now) {
        throw httpError(400, `"${combo.name}" offer has not started yet.`);
    }
    if (combo.endDate && new Date(combo.endDate).setHours(23, 59, 59, 999) < now) {
        throw httpError(400, `"${combo.name}" offer has expired.`);
    }
    if (qty > Number(combo.stockQuantity)) {
        throw httpError(400, `Only ${combo.stockQuantity} of "${combo.name}" available.`);
    }

    const products = combo.products || [];
    if (products.length === 0) {
        throw httpError(400, `"${combo.name}" has no products.`);
    }

    // Har product ka hissa: uski selling price × quantity ke hisaab se
    const byPrice   = products.map(p => Number(p.sellingPrice || 0) * (p.quantity || 1));
    const weights   = byPrice.some(w => w > 0) ? byPrice : products.map(p => p.quantity || 1);
    const weightSum = weights.reduce((s, w) => s + w, 0);

    const comboTotal = round2(Number(combo.comboPrice) * qty);
    let allocated = 0;

    return products.map((p, i) => {
        const isLast    = i === products.length - 1;
        const lineTotal = isLast
            ? round2(comboTotal - allocated)
            : round2((comboTotal * weights[i]) / weightSum);
        allocated = round2(allocated + lineTotal);

        const lineQty = (p.quantity || 1) * qty;
        return {
            product:      p.id,
            name:         `[COMBO: ${combo.name}] ${p.name}`.slice(0, 255),
            image:        p.thumbnail || null,
            price:        round2(lineTotal / lineQty),
            quantity:     lineQty,
            total:        lineTotal,
            unit:         p.unit || 'PCS',
            variantId:    null,
            variantLabel: null,
        };
    });
};

// Stock atomically reserve karo (oversell na ho), fail hone par wapas do
const reserveComboStock = async (reserved, comboId, qty) => {
    const [r] = await pool.query(
        `UPDATE combo_offers SET stockQuantity = stockQuantity - ?
         WHERE id = ? AND stockQuantity >= ?`,
        [qty, comboId, qty]
    );
    if (r.affectedRows === 0) {
        throw httpError(400, 'A combo in your order just went out of stock. Please review your cart.');
    }
    reserved.push({ id: comboId, qty });
};

const releaseComboStock = async (reserved) => {
    for (const r of reserved) {
        await pool.query(
            `UPDATE combo_offers SET stockQuantity = stockQuantity + ? WHERE id = ?`,
            [r.qty, r.id]
        ).catch(() => {});
    }
    reserved.length = 0;
};


// ─── Place Order ──────────────────────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
    const reservedCombos = [];   // stock jo reserve hua, order fail hone par wapas dena hai

    try {
        const {
            addressId,
            paymentMethod = 'COD',
            note = '',
            couponCode = null,
            couponDiscount = 0,
            shippingCharge = 0,
            tax = 0,
            razorpayOrderId = null,
            razorpayPaymentId = null,
            buyNow = false,
            productId = null,
            quantity = 1,
            variantId = null,
            // ── Combo fields (price client se nahi liya jaata, DB se aata hai) ──
            isCombo = false,
            comboId = null,
        } = req.body;

        // ── 1. Fetch user + address ───────────────────────────────────────
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const addresses = user.address ?? [];
        const address = addressId
            ? addresses.find(a => a.id == addressId)
            : addresses.find(a => a.isDefault) || addresses[0];

        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'No delivery address found. Please add one.',
            });
        }

        // ── 2. Build order items ──────────────────────────────────────────
        let orderItems = [];

        // ── COMBO BUY NOW ─────────────────────────────────────────────────
        if (isCombo && comboId) {
            const qty = Number(quantity);
            if (!Number.isInteger(qty) || qty < 1) {
                return res.status(400).json({ success: false, message: 'Invalid quantity' });
            }

            const combo = await ComboOffer.findById(Number(comboId));
            const lines = buildComboLines(combo, qty);          // validate + DB price
            await reserveComboStock(reservedCombos, combo.id, qty);
            orderItems = lines;

        // ── BUY NOW (normal product) ──────────────────────────────────────
        } else if (buyNow && productId) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            const qty = Number(quantity) || 1;

            let price        = Number(product.sellingPrice ?? product.price ?? 0);
            let variantLabel = null;

            if (variantId && product.variants?.length > 0) {
                const selectedVariant = product.variants.find(v => v.id == variantId);
                if (selectedVariant) {
                    price        = Number(selectedVariant.sellingPrice ?? price);
                    variantLabel = selectedVariant.label || null;
                }
            }

            orderItems = [{
                product:      product.id,
                name:         product.name,
                image:        product.thumbnail || product.image || null,
                price,
                quantity:     qty,
                total:        price * qty,
                variantId:    variantId || null,
                variantLabel: variantLabel,
                unit:         product.unit ?? 'PCS',
            }];

        // ── CART ORDER (products + combos) ────────────────────────────────
        } else {
            const cart = await Cart.findByUser(req.user.id);
            if (!cart || !cart.items || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: 'Your cart is empty' });
            }

            for (const item of cart.items) {
                if (item.isCombo) {
                    const qty   = item.quantity || 1;
                    const combo = await ComboOffer.findById(item.combo.id);   // fresh DB data
                    orderItems.push(...buildComboLines(combo, qty));
                    await reserveComboStock(reservedCombos, item.combo.id, qty);
                } else {
                    const p          = item.product;
                    const hasVariant = !!item.variant;
                    const price      = hasVariant && item.variant.sellingPrice
                        ? Number(item.variant.sellingPrice)
                        : Number(p.sellingPrice ?? p.price ?? 0);
                    const qty        = item.quantity || 1;
                    orderItems.push({
                        product:      p.id,
                        name:         p.name,
                        image:        p.thumbnail || p.image || null,
                        price,
                        quantity:     qty,
                        total:        price * qty,
                        variantId:    item.variant?.id ?? null,
                        variantLabel: item.variant?.label ?? null,
                        unit:         p.unit ?? 'PCS',
                    });
                }
            }
        }

        // ── 3. Pricing ────────────────────────────────────────────────────
        const subtotal = round2(orderItems.reduce((sum, i) => sum + i.total, 0));
        const discount = Number(couponDiscount) || 0;
        const total    = round2(Math.max(0, subtotal - discount + Number(shippingCharge) + Number(tax)));

        // ── 4. Create order ───────────────────────────────────────────────
        const paymentStatus = (paymentMethod === 'Razorpay' && razorpayPaymentId) ? 'Paid' : 'Pending';

        const order = await Order.create({
            user:            req.user.id,
            items:           orderItems,
            subtotal,
            discount,
            shippingCharge:  Number(shippingCharge),
            tax:             Number(tax),
            total,
            couponCode:      couponCode || null,
            couponDiscount:  discount,
            shippingAddress: snapshotAddress(address),
            paymentMethod,
            paymentStatus,
            razorpayOrderId,
            razorpayPaymentId,
            note,
            estimatedDeliveryAt: null,
        });

        // Order ban gaya — ab reserved stock wapas nahi dena
        reservedCombos.length = 0;

        // ── 5. Clear cart (sirf normal cart order ke liye) ────────────────
        if (!buyNow && !isCombo) {
            await Cart.clearByUser(req.user.id);
        }

        // ── 6. Respond ────────────────────────────────────────────────────
        res.status(201).json({ success: true, message: 'Order placed successfully!', order });

        // ── 7. Background notifications ───────────────────────────────────
        fireAndForget(async () => {
            const { subject, html } = orderPlacedEmail(user.fullName, order.id, total, paymentMethod);
            const message = `Hello ${user.name}! Order #${order.id} placed. Total: ₹${total}. – KolkataKart`;
            await sendNotification({ phone: user.phone, email: user.email, subject, message, html });

            if (user.phone) {
                const smsMessage =
                    `Hello ${user.name || user.fullName}!\n\n` +
                    `Your order has been placed successfully.\n` +
                    `Order ID  : #${order.id}\n` +
                    `Total     : Rs.${total}\n` +
                    `Payment   : ${paymentMethod}\n\n` +
                    `We will notify you once it's shipped.\n` +
                    `– KolkataKart Team`;
                await sendSms(user.phone, smsMessage);
            }
        }, 'place-order-notifications');

    } catch (err) {
        await releaseComboStock(reservedCombos);   // order fail hua to reserved stock wapas
        console.error('[POST /api/orders/place]', err.message);
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};


// ─── Get My Orders ────────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.user.id });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Get Single Order (user-scoped) ──────────────────────────────────────────
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.id, user_id: req.user.id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Cancel Order ─────────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
    try {
        // Step 1: Find order
        const order = await Order.findOne({
            id: Number(req.params.id),      // ✅ convert string to integer
            user_id: req.user.id
        });
        if (!order) return res.status(404).json({
            success: false,
            message: 'Order not found'
        });

        // Step 2: Check status
        if (!['Pending', 'Processing'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a ${order.status} order`,
            });
        }

        // Step 3: Fetch user
        const user = await User.findById(order.user_id);

        // Step 4: Format date for MySQL ✅
        const cancelledAt = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');  // → "2026-06-25 12:30:00"

        // Step 5: Update order
        const updated = await Order.findByIdAndUpdate(
            Number(req.params.id),   // ✅ integer
            {
                status: 'Cancelled',
                cancelledAt,         // ✅ MySQL formatted string
            }
        );

        // Step 6: Respond
        res.json({
            success: true,
            message: 'Order cancelled',
            order: updated
        });

        // Step 7: Background SMS
        fireAndForget(async () => {
            if (user?.phone) {
                const smsMessage =
                    `Hello ${user.name || user.fullName}!\n\n` +
                    `Your order #${order.orderNumber} has been cancelled.\n` +
                    `If you did not request this, please contact support.\n\n` +
                    `– KolkataKart Team`;

                await sendSms(user.phone, smsMessage);
            }
        }, 'cancel-order-sms');

    } catch (err) {
        console.error('[PATCH /cancel]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Admin: Get All Orders (paginated + filtered) ─────────────────────────────
exports.adminGetAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            paymentMethod,
            search,
            dateFrom,
            dateTo,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const filters = {};
        if (status && status !== 'All') filters.status = status;
        if (paymentStatus && paymentStatus !== 'All') filters.paymentStatus = paymentStatus;
        if (paymentMethod && paymentMethod !== 'All') filters.paymentMethod = paymentMethod;

        if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString().slice(0, 19).replace('T', ' ');
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            filters.dateTo = end.toISOString().slice(0, 19).replace('T', ' ');
        }

        const { orders, total } = await Order.adminFind({
            filters,
            search: search?.trim() || null,
            sortBy,
            sortOrder,
            page: Number(page),
            limit: Number(limit),
        });

        res.json({
            success: true,
            orders,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ─── Admin: Update Order Status ───────────────────────────────────────────────
exports.adminUpdateOrderStatus = async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;

        // Must have at least one field to update
        if (!status && !paymentStatus) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }

        const updateData = {};

        // ── Apply status ──────────────────────────────────────────────────
        if (status) {
            updateData.status = status;

            if (status === 'Delivered') {
                updateData.deliveredAt = new Date();
                updateData.paymentStatus = 'Paid';   // force Paid on delivery
            }

            if (status === 'Cancelled') {
                updateData.cancelledAt = new Date();
            }
        }

        // ── Apply paymentStatus from body ONLY if status != Delivered ─────
        // (Delivered forces Paid above, so don't let body override it back)
        if (paymentStatus && status !== 'Delivered') {
            updateData.paymentStatus = paymentStatus;
        }

        const order = await Order.findByIdAndUpdate(req.params.id, updateData);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // ── Push status history only when status actually changed ─────────
        if (status) {
            await Order.pushStatusHistory(req.params.id, status);
        }

        // ── Re-fetch updated order to return fresh data ───────────────────
        const updatedOrder = await Order.findById(req.params.id);

        res.json({ success: true, order: updatedOrder });
        if (status) creditSellerWalletForOrder(req.params.id, status).catch(() => {});

        // ── Background notifications ──────────────────────────────────────
        fireAndForget(async () => {
            if (!status) return;   // no SMS if only paymentStatus changed

            const customer = await User.findById(order.user_id);
            if (!customer) return;

            const { subject, html } = orderStatusEmail(customer.fullName, order.id, status);
            const message = `Hello ${customer.name}! Your order #${order.id} status: ${status}. – KolkataKart`;
            await sendNotification({ phone: customer.phone, email: customer.email, subject, message, html });

            if (customer.phone) {
                const statusMessages = {
                    'Processing': `Your order #${order.id} is being prepared.`,
                    'Shipped': `Your order #${order.id} has been shipped!`,
                    'Picked Up': `Your order #${order.id} has been picked up by the driver.`,
                    'In Transit': `Your order #${order.id} is in transit.`,
                    'On The Way': `Your order #${order.id} is almost there!`,
                    'Delivered': `Your order #${order.id} has been delivered. Thank you!`,
                    'Cancelled': `Your order #${order.id} has been cancelled.`,
                };

                const smsMessage =
                    `Hello ${customer.name || customer.fullName}!\n\n` +
                    (statusMessages[status] || `Your order #${order.id} status: ${status}`) +
                    `\n\n– KolkataKart Team`;

                await sendSms(customer.phone, smsMessage);
            }
        }, 'order-status-update-notifications');

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Admin: Assign Rider ──────────────────────────────────────────────────────
exports.adminAssignRider = async (req, res) => {
    try {
        const { driverId } = req.body;
        if (!driverId) {
            return res.status(400).json({ success: false, message: 'driverId is required' });
        }

        const Driver = require('../models/Driver');
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const order = await Order.findByIdAndUpdate(req.params.id, {
            assignedDriver_id: driverId,
            status: 'Shipped',
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        await Order.pushStatusHistory(
            req.params.id,
            'Shipped',
            `Assigned to driver ${driver.fullName}`
        );

        // ── Respond immediately ───────────────────────────────────────────
        res.json({ success: true, message: 'Rider assigned successfully', order });

        // ── Background: notify driver + customer ──────────────────────────
        fireAndForget(async () => {
            const customer = await User.findById(order.user_id);

            // ── Notify customer ───────────────────────────────────────────
            if (customer) {
                const { subject: cs, html: ch } = riderAssignedEmail(
                    customer.fullName,
                    order.id,
                    driver.fullName,
                    driver.phone
                );
                await sendNotification({
                    phone: customer.phone,
                    email: customer.email,
                    subject: cs,
                    message: `Driver ${driver.fullName} assigned to your order #${order.id}.`,
                    html: ch,
                });

                if (customer.phone) {
                    const customerSms =
                        `Hello ${customer.name || customer.fullName}!\n\n` +
                        `Great news! Your order #${order.id} has been assigned to a delivery driver.\n` +
                        `Driver : ${driver.fullName}\n` +
                        `Phone  : ${driver.phone}\n\n` +
                        `Your order is on its way!\n` +
                        `– KolkataKart Team`;

                    await sendSms(customer.phone, customerSms);
                }
            }

            // ── Notify driver ─────────────────────────────────────────────
            const { subject: ds, html: dh } = driverAssignedEmail(
                driver.fullName,
                order.id,
                order.shippingAddress?.city,
                order.shippingAddress?.pincode,
                order.shippingAddress?.name,
                order.shippingAddress?.phone
            );
            await sendNotification({
                phone: driver.phone,
                email: driver.email,
                subject: ds,
                message: `New order #${order.id} assigned to you. – KolkataKart`,
                html: dh,
            });

            if (driver.phone) {
                const driverSms =
                    `Hello ${driver.fullName}!\n\n` +
                    `A new order has been assigned to you.\n` +
                    `Order ID : #${order.id}\n` +
                    `Address  : ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.pincode || ''}\n` +
                    `Customer : ${order.shippingAddress?.name || ''}\n` +
                    `Phone    : ${order.shippingAddress?.phone || ''}\n\n` +
                    `Please pick it up as soon as possible.\n` +
                    `– KolkataKart Team`;

                await sendSms(driver.phone, driverSms);
            }
        }, 'assign-rider-notifications');

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Admin: Get Single Order Detail ──────────────────────────────────────────
exports.adminGetOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ─── Admin: Set Delivery Estimate ─────────────────────────────────────────────
exports.adminSetDeliveryEstimate = async (req, res) => {
    try {
        const { estimatedDeliveryAt } = req.body;

        if (!estimatedDeliveryAt) {
            return res.status(400).json({
                success: false,
                message: 'estimatedDeliveryAt required'
            });
        }

        const formatted = new Date(estimatedDeliveryAt)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');

        const order = await Order.findByIdAndUpdate(req.params.id, {
            estimatedDeliveryAt: formatted
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updated = await Order.findById(req.params.id);
        res.json({ success: true, order: updated });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};