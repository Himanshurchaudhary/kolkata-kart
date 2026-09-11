const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db.js');
require('dotenv').config();
const app = express();
connectDB();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const routes = [
  ['/api/auth', './routes/authRoutes.js'],
  ['/api/products', './routes/productRoutes.js'],
  ['/api/Category', './routes/categoryRoutes.js'],
  ['/api/flash', './routes/flashSaleRoutes.js'],
  ['/api/ad', './routes/adRoutes.js'],
  ['/api/coupon', './routes/couponRoutes.js'],
  ['/api/blog', './routes/blogRoutes.js'],
  ['/api/driver', './routes/driverRoutes.js'],
  ['/api/customers', './routes/customerRoutes.js'],
  ['/api/business', './routes/businessRoutes.js'],
  ['/api/taxes', './routes/taxRoutes.js'],
  ['/api/delivery', './routes/deliveryRoutes.js'],
  ['/api/currencies', './routes/currencyRoutes.js'],
  ['/api/payment', './routes/paymentSettingRoutes.js'],
  ['/api/sms-settings', './routes/smsRoutes.js'],
  ['/api/google', './routes/googleAuthRoutes.js'],
  ['/api/pusher', './routes/pusherRoutes.js'],
  ['/api/mail', './routes/mailRoutes.js'],
  ['/api/firebase', './routes/Firebaseroutes.js'],
  ['/api/user', './routes/User/User.js'],
  ['/api/wishlist', './routes/User/wishlistRoutes.js'],
  ['/api/cart', './routes/User/cartRoutes.js'],
  ['/api/address', './routes/User/Addressroutes.js'],
  ['/api/ticket', './routes/ticketIssueType.js'],
  ['/api/support', './routes/Supportticket.js'],
  ['/api/orders', './routes/Orderroutes.js'],
  ['/api/invoice', './routes/Invoiceroute.js'],
  ['/api/receipt', './routes/Receiptroute.js'],
  ['/api/banner', './routes/bannerRoutes.js'],
  ['/api/dashboard', './routes/Dashboardroutes.js'],
  ['/api/seller', './routes/sellerRoutes.js'],
  ['/api/adminSellers', './routes/adminSellerRoutes.js'],
];
for (const [path_, file] of routes) {
  try {
    app.use(path_, require(file));
    console.log(`✅ Loaded: ${file}`);
  } catch (e) {
    console.error(`❌ FAILED: ${file} →`, e.message);
  }
}
// ✅ Dist path — multiple fallbacks
const possiblePaths = [
  path.join(__dirname, '../dist'),
  '/home/u873522560/domains/graminkcart.in/nodejs/dist',
  path.join(__dirname, '../../dist'),
];
let frontendDist = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    frontendDist = p;
    break;
  }
}
console.log('📁 __dirname:', __dirname);
console.log('📁 frontendDist resolved:', frontendDist);
if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get('/{*path}', (req, res) => {
    // ✅ FIX: API routes ko index.html mat do
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.error('❌ dist/index.html nahi mila kisi bhi path pe!');
  app.get('/{*path}', (req, res) => {
    res.status(500).send('Frontend build not found. Please upload dist/ folder.');
  });
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));