const Admin  = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User = require('../models/User/User');
const Order = require('../models/Order');


exports.login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // Find by email AND role — prevents delivery boy logging into admin panel
        const user = await Admin.findOne({ email, role });

        if (!user) {
            return res.status(404).json({
                message: `User not found as ${role}. Please check your credentials.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },  // user.id not user._id
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id:    user.id,    // integer, not ObjectId
                name:  user.name,
                email: user.email,
                role:  user.role,
            }
        });

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};





// ── Get All Customers ─────────────────────────────────
exports.getAllCustomers = async (req, res) => {
    try {
        const [rows] = await require('../config/db').pool.query(
            `SELECT id, fullName, email, phone, country, avatar, gender, 
                    dateOfBirth, isActive, createdAt 
             FROM users ORDER BY createdAt DESC`
        );
        return res.status(200).json({ success: true, customers: rows });
    } catch (error) {
        console.error('GetAllCustomers error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── Get Single Customer ───────────────────────────────
exports.getCustomer = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }
        return res.status(200).json({ success: true, customer: user });
    } catch (error) {
        console.error('GetCustomer error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── Update Customer Password (Admin) ─────────────────
exports.updateCustomerPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { id } = req.params;

        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'New password is required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        const hashedPassword = await User.hashPassword(newPassword);
        await User.findByIdAndUpdate(id, { password: hashedPassword });

        return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('UpdateCustomerPassword error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── Toggle Customer Active Status ─────────────────────
exports.toggleCustomerStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        await User.findByIdAndUpdate(req.params.id, { isActive: !user.isActive });

        return res.status(200).json({
            success: true,
            message: `Customer ${!user.isActive ? 'activated' : 'deactivated'} successfully.`,
        });
    } catch (error) {
        console.error('ToggleCustomerStatus error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── Get Customer Orders ───────────────────────────────

// ── Get Customer Orders ───────────────────────────────
exports.getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.params.id });
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('GetCustomerOrders error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};