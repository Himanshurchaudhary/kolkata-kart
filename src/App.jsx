import React, { useState, useEffect ,useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from './Components/ScrollToTop';  // adjust path as needed


// Admin Pages & Components
import LoginPage from './Admin/Pages/Login';
import AdminLayout from './Components/AdminLayout';
import SellerAuth from './Sellar/Sellerauth';
import SellerDashboard from './Sellar/sellardashboard';


// User Pages & Components
import UserLoginPage from './User/Pages/UserLogin';
import UserLayout from './User/UserLayout';
import HomePage from './User/Pages/HomePage';

// User Shell — visible on all user-side pages
import UserNavbar from './User/Components/Usernavbar';
import UserFooter from './User/Components/Userfooter';
import ResetPassword from './User/Pages/ResetPassword';  // ← add this import
import ForgotPassword from './User/Pages/ForgotPassword';


// driver
import DeliveryAgentApp from './Driver/Deliveryagentapp';



///////////////////////////

import ProductsPage from './User/Pages/Productspage';
import BlogPage from './User/Pages/Blogpage';
import ProductDetails from './User/Pages/Productdetails';
import ContactPage from './User/Pages/Contactpage';
import AboutUs from './User/Pages/Aboutus';
import TermsAndConditions from './User/Pages/Termsandconditions';
import PrivacyPolicy from './User/Pages/Privacypolicy';
import DeleteAccount from './User/Pages/Deleteaccount';


//////////////////////////////////////////////////////////////////////////////////

import CartToast from './User/Components/Carttoast'; // apna sahi path lagao


/////////////////////////////////////////////////////////////////////////////////

// ─────────────────────────────────────────
// Full-Page Loader Component
// ─────────────────────────────────────────
const PageLoader = ({ fading, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const intervalRef = useRef(null);
 
  const statusMsgs = [
    'Initializing...',
    'Loading plants...',
    'Growing roots...',
    'Almost ready...',
    'Welcome!',
  ];
 
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + Math.random() * 3.5, 100);
        setStatusIdx(Math.min(Math.floor(next / 25), statusMsgs.length - 1));
        if (next >= 100) {
          clearInterval(intervalRef.current);
          onComplete?.();
        }
        return next;
      });
    }, 80);
    return () => clearInterval(intervalRef.current);
  }, []);
 
  const pct = Math.round(progress);
  const barWidth = (242 * pct) / 100; // 260 - 9*2 = 242
 
  const dots = [
    { size: 8, shape: 2, color: '#228b22', delay: '0s' },
    { size: 8, shape: 50, color: '#e85414', delay: '0.2s' },
    { size: 6, shape: 2, color: '#2da82d', delay: '0.4s' },
    { size: 6, shape: 50, color: '#e85414cc', delay: '0.6s' },
    { size: 8, shape: 2, color: '#1a7a1a', delay: '0.8s' },
  ];
 
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: 'opacity 1.5s ease',
        padding: '1rem',
        boxSizing: 'border-box',
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes egFadeUp    { 0%{opacity:0;transform:translateY(18px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes egLeafSway  { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
        @keyframes egDropIn    { 0%{opacity:0;transform:translateY(-30px) scale(0.7)} 70%{transform:translateY(4px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes egStemGrow  { 0%{height:0;opacity:0} 100%{height:72px;opacity:1} }
        @keyframes egDotBounce { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(-8px);opacity:1} }
        @keyframes egTagFade   { 0%{opacity:0;letter-spacing:6px} 100%{opacity:1;letter-spacing:3px} }
        @keyframes egHexPop    { 0%{opacity:0;transform:scale(0.5)} 100%{opacity:1;transform:scale(1)} }
 
        .eg-hex-wrap  { animation: egDropIn 0.7s cubic-bezier(.22,.61,.36,1) 0.1s both; }
        .eg-hex-poly  { animation: egHexPop 0.5s ease-out 0.2s both; }
        .eg-leaf0     { animation: egFadeUp 0.4s ease-out 0.9s both, egLeafSway 2.2s ease-in-out 1.2s infinite; transform-origin: 80px 130px; opacity: 0; }
        .eg-leaf1     { animation: egFadeUp 0.4s ease-out 1.05s both, egLeafSway 2.5s ease-in-out 1.5s infinite; transform-origin: 80px 130px; opacity: 0; }
        .eg-leaf2     { animation: egFadeUp 0.4s ease-out 1.2s both, egLeafSway 2s ease-in-out 0.9s infinite; transform-origin: 80px 130px; opacity: 0; }
        .eg-dew0      { animation: egFadeUp 0.3s ease-out 1.3s both; opacity: 0; }
        .eg-dew1      { animation: egFadeUp 0.3s ease-out 1.4s both; opacity: 0; }
        .eg-monogram  { animation: egFadeUp 0.4s ease-out 1.5s both; opacity: 0; }
        .eg-brand     { animation: egFadeUp 0.5s ease-out 0.9s both; opacity: 0; }
        .eg-tagline   { animation: egTagFade 0.8s ease-out 1.2s both; opacity: 0; }
        .eg-pct       { animation: egFadeUp 0.4s ease-out 1.4s both; opacity: 0; }
        .eg-dots-wrap { animation: egFadeUp 0.4s ease-out 1.5s both; opacity: 0; }
        .eg-status    { animation: egFadeUp 0.4s ease-out 1.6s both; opacity: 0; }
      `}</style>
 
      {/* Hexagon icon */}
      <div className="eg-hex-wrap" style={{ position: 'relative', marginBottom: 24 }}>
        <svg width="160" height="148" viewBox="0 0 160 148">
          <defs>
            <clipPath id="egStemClip">
              <rect x="77" y="58" width="6" height="72" />
            </clipPath>
          </defs>
 
          <polygon
            className="eg-hex-poly"
            points="80,4 152,42 152,106 80,144 8,106 8,42"
            fill="#f2fbf2" stroke="#228b22" strokeWidth="2"
          />
          <polygon
            points="80,16 140,50 140,98 80,132 20,98 20,50"
            fill="none" stroke="rgba(232,84,20,0.13)" strokeWidth="1"
          />
 
          {/* Stem animated via rect height trick */}
          <rect
            x="78.5" y="58" width="3" rx="1.5"
            fill="#228b22"
            style={{ height: 0, opacity: 0, animation: 'egStemGrow 0.6s ease-out 0.7s forwards' }}
          />
 
          {/* Leaves */}
          <ellipse className="eg-leaf0" cx="64" cy="84" rx="20" ry="10" fill="#2da82d" transform="rotate(-30,64,84)" />
          <ellipse className="eg-leaf1" cx="96" cy="74" rx="17" ry="9" fill="#1a7a1a" transform="rotate(25,96,74)" />
          <ellipse className="eg-leaf2" cx="80" cy="62" rx="11" ry="7" fill="#3ec43e" />
 
          {/* Dewdrops */}
          <circle className="eg-dew0" cx="68" cy="79" r="2.5" fill="#fff" opacity="0.8" />
          <circle className="eg-dew1" cx="90" cy="70" r="2" fill="#fff" opacity="0.7" />
 
          {/* EG monogram */}
          <text
            className="eg-monogram"
            x="80" y="118"
            textAnchor="middle"
            fontSize="11"
            fill="#228b22"
            fontFamily="Georgia,serif"
            fontWeight="700"
            letterSpacing="3"
          >EG</text>
        </svg>
      </div>
 
      {/* Brand name */}
      <div className="eg-brand" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 'clamp(28px,9vw,42px)', fontWeight: 700, color: '#1a7a1a', fontFamily: "Georgia,'Times New Roman',serif", letterSpacing: -1 }}>Eco</span>
        <span style={{ fontSize: 'clamp(28px,9vw,42px)', fontWeight: 700, color: '#155a15', fontFamily: "Georgia,'Times New Roman',serif", letterSpacing: -1 }}>Grow</span>
        <span style={{ fontSize: 'clamp(28px,9vw,42px)', fontWeight: 700, color: '#e85414', fontFamily: "Georgia,'Times New Roman',serif", letterSpacing: -1 }}>Bazar</span>
      </div>
 
      {/* Tagline */}
      <div className="eg-tagline" style={{ fontSize: 10, color: '#888', fontFamily: 'monospace', marginBottom: 28, textTransform: 'uppercase' }}>
        Plants &bull; Nature &bull; Better Life
      </div>
 
      {/* Leaf-shaped progress bar (SVG) */}
      <div style={{ width: 'min(260px,82vw)', marginBottom: 10 }}>
        <svg width="100%" height="18" viewBox="0 0 260 18" preserveAspectRatio="none">
          <defs>
            <clipPath id="egLeafClip">
              <path d="M9,9 Q130,-2 251,9 Q130,20 9,9 Z" />
            </clipPath>
          </defs>
          <path d="M9,9 Q130,-2 251,9 Q130,20 9,9 Z" fill="#eef7ee" stroke="#c8e6c8" strokeWidth="1" />
          <rect x="9" y="0" width={barWidth} height="18" fill="#228b22" clipPath="url(#egLeafClip)" style={{ transition: 'width 0.1s linear' }} />
        </svg>
      </div>
 
      {/* Percentage */}
      <div className="eg-pct" style={{ fontSize: 12, color: '#4a8c4a', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: 20 }}>
        {pct}%
      </div>
 
      {/* Bouncing dots */}
      <div className="eg-dots-wrap" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        {dots.map((d, i) => (
          <div key={i} style={{
            width: d.size, height: d.size,
            borderRadius: d.shape,
            background: d.color,
            animation: `egDotBounce 1.2s ease-in-out ${d.delay} infinite`,
          }} />
        ))}
      </div>
 
      {/* Status text */}
      <div className="eg-status" style={{ fontSize: 10, color: '#bbb', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', minHeight: 16 }}>
        {statusMsgs[statusIdx]}
      </div>
    </div>
  );
};







// ─────────────────────────────────────────
// Admin Protected Route — checks adminToken
// If no token → redirect to /admin/login
// ─────────────────────────────────────────
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};


const SellerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sellerToken');
  if (!token) return <Navigate to="/seller/auth" replace />;
  return children;
};

// ─────────────────────────────────────────
// User Protected Route — checks userToken
// If no token → redirect to /user/login
// ─────────────────────────────────────────
const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/user/login" replace />;
  }
  return children;
};


// ─────────────────────────────────────────
// Layout wrapper — shows navbar & footer
// only on non-admin routes
// ─────────────────────────────────────────
const AppLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  const isDriverRoute = pathname.startsWith('/driver');   // ← add this
    const isSellerRoute = pathname.startsWith('/seller');  // ← ADD



  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isAdminRoute && !isDriverRoute && !isSellerRoute && <UserNavbar />}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && !isDriverRoute && !isSellerRoute && <UserFooter />}
    </div>
  );
};


function App() {
  const [appReady, setAppReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
  const timer = setTimeout(() => {
    setFadeOut(true);
    setTimeout(() => setAppReady(true), 1000); // fade duration — mat chhedo
  }, 2000); // ← BAS YAHI BADHAO

  return () => clearTimeout(timer);
}, []);

  // Show loader until app is ready
  if (!appReady) return <PageLoader fading={fadeOut} />;

  return (
    <AppLayout>
      <CartToast />
      <Routes>

        <Route path="/" element={<HomePage />} />


        {/* 1. Default Route → redirect to home page */}

        {/* ──────────────────────────────── */}
        {/*         ADMIN ROUTES             */}
        {/* ──────────────────────────────── */}

        {/* 2. Public Route — Admin Login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* 3. Protected Admin Routes
            - Any path under /admin/* is protected
            - No token → goes back to /admin/login automatically */}
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        />

        {/* ──────────────────────────────── */}
        {/*         USER ROUTES              */}
        {/* ──────────────────────────────── */}

        {/* 4. Public Routes — no token required */}
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route path="/user/product" element={<ProductsPage />} />
        <Route path="/user/blog" element={<BlogPage />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/user/contect" element={<ContactPage />} />
        <Route path="/user/about" element={<AboutUs />} />
        <Route path="/user/termcondition" element={<TermsAndConditions />} />
        <Route path="/user/privacy" element={<PrivacyPolicy />} />
        <Route path="/user/deleteaccount" element={<DeleteAccount />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />









        {/* /////////////////// driver /////////////////////////////////// */}


        <Route path="/driver/*" element={<DeliveryAgentApp />} />

        {/* /////////////////// driver /////////////////////////////////// */}

        {/* ──────────────────────────────── */}
{/*        SELLER ROUTES             */}
{/* ──────────────────────────────── */}

{/* Public — Login & Register */}
<Route path="/seller/auth" element={<SellerAuth />} />

{/* Protected — Dashboard */}
<Route
  path="/seller/*"
  element={
    <SellerProtectedRoute>
      <SellerDashboard />
    </SellerProtectedRoute>
  }
/>


        {/* 5. Protected User Routes
            - Any path under /user/* is protected
            - No token → goes back to /user/login automatically */}
        <Route
          path="/user/*"
          element={
            <UserProtectedRoute>
              <UserLayout />
            </UserProtectedRoute>
          }
        />

        {/* 6. 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-screen font-bold text-2xl text-slate-400">
              404 - Page Not Found
            </div>
          }
        />

      </Routes>
    </AppLayout>
  );
}

export default App;