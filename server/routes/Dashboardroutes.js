// routes/dashboardRoutes.js
const express = require('express');
const router  = express.Router();
const {
    getStats,
    getRevenueChart,
    getOrdersChart,
    getPaymentBreakdown,
    getRecentOrders,
    getTopProducts,
    getDriverStats,
} = require('../controllers/Dashboardcontroller');
const { protect } = require('../middleware/authMiddleware');

// All dashboard routes are admin-protected
router.get('/stats',               protect, getStats);
router.get('/revenue-chart',       protect, getRevenueChart);
router.get('/orders-chart',        protect, getOrdersChart);
router.get('/payment-breakdown',   protect, getPaymentBreakdown);
router.get('/recent-orders',       protect, getRecentOrders);
router.get('/top-products',        protect, getTopProducts);
router.get('/driver-stats',        protect, getDriverStats);

module.exports = router;

// ── Register in server.js / app.js ───────────────────────────────────────────
// app.use('/api/dashboard', require('./routes/dashboardRoutes'));