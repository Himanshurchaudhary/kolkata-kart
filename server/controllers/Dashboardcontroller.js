// controllers/dashboardController.js
const { pool } = require('../config/db');

// ─── Helper: run a query and return rows ──────────────────────────────────────
const q = async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows;
};

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Summary cards: revenue, orders, customers, drivers, conversion
exports.getStats = async (req, res) => {
    try {
        const [
            orderStats,
            customerCount,
            driverCount,
            revenueStats,
            codStats,
        ] = await Promise.all([
            // Orders by status
            q(`
                SELECT
                    COUNT(*)                                         AS total,
                    SUM(status = 'Delivered')                        AS delivered,
                    SUM(status = 'Pending')                          AS pending,
                    SUM(status = 'Processing')                       AS processing,
                    SUM(status = 'Cancelled')                        AS cancelled,
                    SUM(status IN ('Picked Up','In Transit','On The Way','Shipped')) AS active
                FROM orders
            `),
            // Total customers
            q(`SELECT COUNT(*) AS total FROM users`),
            // Total drivers
            q(`SELECT COUNT(*) AS total, SUM(isOnline = 1) AS online FROM drivers WHERE isActive = 1`),
            // Revenue
            q(`
                SELECT
                    COALESCE(SUM(total), 0)                          AS totalRevenue,
                    COALESCE(SUM(CASE WHEN paymentStatus='Paid' THEN total ELSE 0 END), 0) AS collectedRevenue,
                    COALESCE(AVG(total), 0)                          AS avgOrderValue
                FROM orders
                WHERE status != 'Cancelled'
            `),
            // COD breakdown (collected)
            q(`
                SELECT
                    SUM(codPaymentMode = 'Cash')   AS cashCount,
                    SUM(codPaymentMode = 'Online')  AS onlineCount,
                    SUM(CASE WHEN codPaymentMode = 'Cash'   THEN total ELSE 0 END) AS cashRevenue,
                    SUM(CASE WHEN codPaymentMode = 'Online' THEN total ELSE 0 END) AS onlineRevenue
                FROM orders
                WHERE paymentMethod = 'COD' AND paymentStatus = 'Paid'
            `),
        ]);

        const os = orderStats[0];
        const rev = revenueStats[0];
        const cod = codStats[0];

        res.json({
            success: true,
            stats: {
                orders: {
                    total: Number(os.total),
                    delivered: Number(os.delivered),
                    pending: Number(os.pending),
                    processing: Number(os.processing),
                    cancelled: Number(os.cancelled),
                    active: Number(os.active),
                },
                customers: Number(customerCount[0].total),
                drivers: {
                    total: Number(driverCount[0].total),
                    online: Number(driverCount[0].online),
                },
                revenue: {
                    total: parseFloat(rev.totalRevenue).toFixed(2),
                    collected: parseFloat(rev.collectedRevenue).toFixed(2),
                    avgOrder: parseFloat(rev.avgOrderValue).toFixed(2),
                },
                cod: {
                    cashCount: Number(cod.cashCount || 0),
                    onlineCount: Number(cod.onlineCount || 0),
                    cashRevenue: parseFloat(cod.cashRevenue || 0).toFixed(2),
                    onlineRevenue: parseFloat(cod.onlineRevenue || 0).toFixed(2),
                },
            },
        });
    } catch (err) {
        console.error('[dashboard/stats]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/dashboard/revenue-chart ────────────────────────────────────────
// Daily revenue for the last N days (default 30)
exports.getRevenueChart = async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days || 30), 90);

        const rows = await q(`
            SELECT
                DATE(createdAt)                                         AS date,
                COALESCE(SUM(total), 0)                                 AS revenue,
                COUNT(*)                                                AS orders,
                COALESCE(SUM(CASE WHEN paymentStatus='Paid' THEN total ELSE 0 END), 0) AS collected
            FROM orders
            WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND status != 'Cancelled'
            GROUP BY DATE(createdAt)
            ORDER BY date ASC
        `, [days]);

        // Fill missing days with 0
        const map = {};
        rows.forEach(r => {
            const key = r.date instanceof Date
                ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}`
                : String(r.date).slice(0, 10);
            map[key] = r;
        });
        const filled = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            filled.push({
                date: key,
                revenue: parseFloat(map[key]?.revenue || 0),
                orders: Number(map[key]?.orders || 0),
                collected: parseFloat(map[key]?.collected || 0),
            });
        }

        res.json({ success: true, chart: filled });
    } catch (err) {
        console.error('[dashboard/revenue-chart]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/dashboard/orders-chart ─────────────────────────────────────────
// Orders by status per day — for a stacked bar chart
exports.getOrdersChart = async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days || 14), 60);

        const rows = await q(`
            SELECT
                DATE(createdAt)         AS date,
                status,
                COUNT(*)                AS count
            FROM orders
            WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(createdAt), status
            ORDER BY date ASC
        `, [days]);

        // Pivot into { date, Delivered, Pending, Cancelled, ... }
        const map = {};
        rows.forEach(({ date, status, count }) => {

            const key = date instanceof Date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                : String(date).slice(0, 10);  // ✅ local date
            if (!map[key]) map[key] = { date: key };
            map[key][status] = Number(count);
        });

        const statuses = ['Delivered', 'Pending', 'Processing', 'Cancelled', 'Shipped'];
        const filled = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const entry = { date: key, ...map[key] };
            statuses.forEach(s => { if (!entry[s]) entry[s] = 0; });
            filled.push(entry);
        }

        res.json({ success: true, chart: filled, statuses });
    } catch (err) {
        console.error('[dashboard/orders-chart]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/dashboard/payment-breakdown ────────────────────────────────────
// Payment method distribution + COD mode breakdown
exports.getPaymentBreakdown = async (req, res) => {
    try {
        const [methods, codModes] = await Promise.all([
            q(`
                SELECT
                    paymentMethod,
                    COUNT(*)                    AS count,
                    COALESCE(SUM(total), 0)     AS revenue
                FROM orders
                WHERE paymentStatus = 'Paid'
                GROUP BY paymentMethod
            `),
            q(`
                SELECT
                    codPaymentMode              AS mode,
                    COUNT(*)                    AS count,
                    COALESCE(SUM(total), 0)     AS revenue
                FROM orders
                WHERE paymentMethod = 'COD'
                  AND paymentStatus = 'Paid'
                  AND codPaymentMode IS NOT NULL
                GROUP BY codPaymentMode
            `),
        ]);

        res.json({
            success: true,
            methods: methods.map(m => ({
                method: m.paymentMethod,
                count: Number(m.count),
                revenue: parseFloat(m.revenue),
            })),
            codModes: codModes.map(c => ({
                mode: c.mode,
                count: Number(c.count),
                revenue: parseFloat(c.revenue),
            })),
        });
    } catch (err) {
        console.error('[dashboard/payment-breakdown]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/dashboard/recent-orders ────────────────────────────────────────
exports.getRecentOrders = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || 10), 50);

        const rows = await q(`
            SELECT
                o.id, o.orderNumber, o.total, o.status,
                o.paymentMethod, o.paymentStatus, o.codPaymentMode,
                o.createdAt,
                u.fullName AS customerName,
                u.email    AS customerEmail,
                o.addr_city AS city
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.createdAt DESC
            LIMIT ?
        `, [limit]);

        res.json({ success: true, orders: rows });
    } catch (err) {
        console.error('[dashboard/recent-orders]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/dashboard/top-products ─────────────────────────────────────────
exports.getTopProducts = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || 5), 20);

        const rows = await q(`
            SELECT
                oi.name,
                oi.image,
                SUM(oi.quantity)            AS unitsSold,
                SUM(oi.total)               AS revenue,
                COUNT(DISTINCT oi.order_id) AS orderCount
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status = 'Delivered'
            GROUP BY oi.product_id, oi.name, oi.image
            ORDER BY revenue DESC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            products: rows.map(r => ({
                name: r.name,
                image: r.image,
                unitsSold: Number(r.unitsSold),
                revenue: parseFloat(r.revenue),
                orderCount: Number(r.orderCount),
            })),
        });
    } catch (err) {
        console.error('[dashboard/top-products]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/dashboard/driver-stats ─────────────────────────────────────────
exports.getDriverStats = async (req, res) => {
    try {
        const rows = await q(`
            SELECT
                d.id, d.fullName, d.vehicleType, d.profileImage,
                d.isOnline, d.totalOrdersDelivered, d.rating,
                COUNT(o.id)              AS activeOrders
            FROM drivers d
            LEFT JOIN orders o
                ON o.assignedDriver_id = d.id
               AND o.status IN ('Picked Up','In Transit','On The Way')
            WHERE d.isActive = 1
            GROUP BY d.id
            ORDER BY d.totalOrdersDelivered DESC
            LIMIT 6
        `);

        res.json({
            success: true,
            drivers: rows.map(d => ({
                id: d.id,
                fullName: d.fullName,
                vehicleType: d.vehicleType,
                profileImage: d.profileImage,
                isOnline: Boolean(d.isOnline),
                totalDelivered: Number(d.totalOrdersDelivered),
                rating: parseFloat(d.rating || 5),
                activeOrders: Number(d.activeOrders),
            })),
        });
    } catch (err) {
        console.error('[dashboard/driver-stats]', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};