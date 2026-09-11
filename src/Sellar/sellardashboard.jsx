// src/Sellar/sellardashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  Menu,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Package,
  IndianRupee,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import SellerSidebar from "./SellerSidebar";
import SellerProfile from "./Sellerprofile";
import SellerAddProduct from "./SellerAddProduct";
import SellerMyProducts from "./SellerMyProducts";
import SellerMyOrders from "./SellerMyOrders";
import SellerMyWallet from "./SellerWallet";

const API = import.meta.env.VITE_API_URL;

// ─── Pending Approval Screen ──────────────────────────────────────
function PendingApproval({ seller }) {
  const steps = [
    { label: "Registration Submitted", state: "done" },
    { label: "Documents Under Review",  state: "active" },
    { label: "Account Approved",        state: "waiting" },
  ];

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform:scale(1);   opacity:.6; }
          100% { transform:scale(1.65);opacity:0; }
        }
        @keyframes bob {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-7px); }
        }
        @keyframes shimmer {
          0%   { background-position:-400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "80vh",
        padding: "24px 16px", textAlign: "center",
      }}>

        <div style={{ position: "relative", marginBottom: 32 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              position: "absolute", inset: -18, borderRadius: "50%",
              border: "2px solid #f97316",
              animation: `pulse-ring 2s ease-out ${i * 0.7}s infinite`,
              pointerEvents: "none",
            }} />
          ))}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
            border: "2px solid #fed7aa",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "bob 3s ease-in-out infinite",
          }}>
            <Hourglass size={34} color="#f97316" />
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", margin: "0 0 10px" }}>
          Account Verification Pending
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 340, lineHeight: 1.75, margin: "0 0 28px" }}>
          Hi <strong>{seller?.fullName || "there"}</strong>! Your seller account is under review.
          Our team will verify your details within <strong>24–48 hours</strong> and notify you by email.
        </p>

        <div style={{
          width: "min(280px, 100%)", height: 6,
          background: "#e5e7eb", borderRadius: 99, overflow: "hidden", marginBottom: 28,
        }}>
          <div style={{
            height: "100%", width: "60%", borderRadius: 99,
            background: "linear-gradient(90deg,#f97316 0%,#fb923c 40%,#fed7aa 60%,#f97316 100%)",
            backgroundSize: "400px 100%",
            animation: "shimmer 2s linear infinite",
          }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "min(280px,100%)" }}>
          {steps.map(({ label, state }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: state === "done" ? "#3a7d1e" : state === "active" ? "#f97316" : "#e5e7eb",
              }}>
                {state === "done"
                  ? <CheckCircle2 size={16} color="#fff" />
                  : state === "active"
                    ? <Clock size={15} color="#fff" />
                    : <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>{i + 1}</span>
                }
              </div>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: state === "done" ? "#2d5a1b" : state === "active" ? "#f97316" : "#9ca3af",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 28,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, color: "#2d5a1b", maxWidth: 340,
        }}>
          Questions? Email <strong>graminkartdc@gmail.com</strong>
        </div>
      </div>
    </>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────
function DashboardHome({ seller }) {
  if (!seller?.isApproved) return <PendingApproval seller={seller} />;

  const stats = [
    { label: "Total Orders",   value: "—",  Icon: ShoppingBag, color: "#3a7d1e", bg: "#f0fdf4" },
    { label: "Total Products", value: "—",  Icon: Package,     color: "#f97316", bg: "#fff7ed" },
    { label: "Revenue",        value: "₹—", Icon: IndianRupee, color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Pending Orders", value: "—",  Icon: AlertCircle, color: "#ef4444", bg: "#fef2f2" },
  ];

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px" }}>
        Welcome back, {seller?.fullName?.split(" ")[0]} 👋
      </h2>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 22px" }}>
        Here's what's happening with your shop today.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{
            background: "#fff", border: "1px solid #e8f5e1",
            borderRadius: 14, padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "#f9fafb", borderRadius: 12,
        padding: "20px 16px", fontSize: 14,
        color: "#6b7280", textAlign: "center",
      }}>
        📊 Order analytics and revenue charts coming soon.
      </div>
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────
const Placeholder = ({ title, Icon }) => (
  <div style={{ padding: 24, textAlign: "center", paddingTop: 80 }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={28} color="#3a7d1e" />
      </div>
    </div>
    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: "0 0 6px" }}>{title}</h3>
    <p style={{ color: "#9ca3af", fontSize: 14 }}>This section is coming soon.</p>
  </div>
);

// ─── Protected Route — waits for API before deciding ─────────────
// isApproved = null  → still loading, render nothing
// isApproved = true  → show component
// isApproved = false → redirect to dashboard
function ProtectedRoute({ isApproved, children }) {
  if (isApproved === null) return null;
  if (isApproved === true) return children;
  return <Navigate to="/seller/dashboard" replace />;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════
export default function SellerDashboard() {
  const navigate     = useNavigate();
  const [seller,     setSeller]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // isApproved has 3 states:
  //   null  = API not yet responded (do not redirect)
  //   true  = approved
  //   false = not approved
  const [isApproved, setIsApproved] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("sellerToken");
    if (!token) {
      navigate("/seller/auth");
      return;
    }

    // Step 1: validate token expiry only
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("sellerToken");
        navigate("/seller/auth");
        return;
      }
      // Set basic info from token — DO NOT set isApproved here
      setSeller({
        fullName:     payload.fullName || payload.email?.split("@")[0] || "Seller",
        email:        payload.email,
        shopName:     payload.shopName,
        shopCategory: payload.shopCategory,
      });
    } catch {
      localStorage.removeItem("sellerToken");
      navigate("/seller/auth");
      return;
    }

    // Step 2: fetch real profile — isApproved set ONLY from here
    fetch(`${API}/api/seller/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.seller) {
          const approved = data.seller.is_approved === 1 ||
                           data.seller.is_approved === true ||
                           data.seller.is_approved === "1";
          setSeller({
            fullName:     data.seller.full_name,
            email:        data.seller.email,
            shopName:     data.seller.shop_name,
            shopCategory: data.seller.shop_category,
            isApproved:   approved,
          });
          setIsApproved(approved); // ← single source of truth
        }
      })
      .catch(() => {
        setIsApproved(false);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", fontSize: 14, color: "#6b7280", gap: 10,
    }}>
      <div style={{
        width: 20, height: 20, border: "2.5px solid #e5e7eb",
        borderTopColor: "#3a7d1e", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      Loading your dashboard…
    </div>
  );

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f8faf8",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      <SellerSidebar
        isApproved={isApproved === true}
        shopName={seller?.shopName}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid #e8f5e1",
          padding: "0 16px", height: 56,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10, gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="mob-menu-btn"
              style={{
                display: "none", background: "none", border: "none",
                cursor: "pointer", color: "#2d5a1b",
                padding: 4, borderRadius: 6, alignItems: "center",
              }}
            >
              <Menu size={22} />
            </button>
            <style>{`@media(max-width:768px){.mob-menu-btn{display:flex!important}}`}</style>

            <div style={{
              fontWeight: 700, fontSize: 15, color: "#2d5a1b",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {seller?.shopName || "Seller Dashboard"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {isApproved !== true && (
              <span style={{
                fontSize: 11, background: "#fff7ed", color: "#f97316",
                border: "1px solid #fed7aa", borderRadius: 99,
                padding: "3px 9px", fontWeight: 700, whiteSpace: "nowrap",
              }}>
                ⏳ Pending
              </span>
            )}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg,#3a7d1e,#6ab04c)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0,
            }}>
              {seller?.fullName?.[0]?.toUpperCase() || "S"}
            </div>
          </div>
        </header>

        {/* Routes */}
        <main style={{ flex: 1, overflowX: "hidden" }}>
          <Routes>
            <Route
              path="dashboard"
              element={
                <DashboardHome
                  seller={{ ...seller, isApproved: isApproved === true }}
                />
              }
            />
            <Route
              path="profile"
              element={<SellerProfile />}
            />
            <Route
              path="add-product"
              element={
                <ProtectedRoute isApproved={isApproved}>
                  <SellerAddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute isApproved={isApproved}>
                  <SellerMyProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute isApproved={isApproved}>
                  <SellerMyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="Wallet"
              element={
                <ProtectedRoute isApproved={isApproved}>
                  <SellerMyWallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to="/seller/dashboard" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}