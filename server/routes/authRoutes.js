const express  = require('express');
const router   = express.Router();
const { login ,getAllCustomers,
    getCustomer,
    updateCustomerPassword,
    toggleCustomerStatus,getCustomerOrders} = require('../controllers/authController');
    const { protect, isAdmin } = require('../middleware/authMiddleware');


    const {
  adminGetSellerProducts,
  adminUpdateProductStatus,
  adminGetSellerProductById,
} = require("../controllers/sellerProductController");

const Admin    = require('../models/Admin');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register-admin
router.post('/register-admin', async (req, res) => {
    try {
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const admin = await Admin.create({
            ...req.body,
            password: hashedPassword,
            role: 'admin',
        });

        const token = jwt.sign(
            { id: admin.id, role: admin.role },   // MySQL: id not _id
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            token,
            user: {
                id:     admin.id,                 // MySQL: id not _id
                name:   admin.name,
                email:  admin.email,
                role:   admin.role,
                mobile: admin.mobile,
            },
        });
    } catch (error) {
        console.error('Register Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email or mobile already registered' });
        }
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

router.get('/customers',             protect, isAdmin,         getAllCustomers);
router.get('/customers/:id',       protect, isAdmin,           getCustomer);
router.put('/customers/:id/password',  protect, isAdmin,       updateCustomerPassword);
router.put('/customers/:id/toggle-status',    protect, isAdmin,    toggleCustomerStatus);
router.get('/customers/:id/orders', protect, isAdmin, getCustomerOrders);
router.get("/seller-products",              protect, adminGetSellerProducts);
router.get("/seller-products/:id",          protect, adminGetSellerProductById);
router.put("/seller-products/:id/status",   protect, adminUpdateProductStatus);



module.exports = router;