// src/Seller/Components/SellerSidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  PlusCircle,
  Package,
  ClipboardList,
  LogOut,
  ShoppingCart,
  X,
  Lock,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",   label: "Dashboard",   Icon: LayoutDashboard },
  { key: "profile",     label: "My Profile",  Icon: User },
  { key: "add-product", label: "Add Product", Icon: PlusCircle },
  { key: "products",    label: "My Products", Icon: Package },
  { key: "orders",      label: "Orders",      Icon: ClipboardList },
  { key: "Wallet",      label: "Wallet",      Icon: ClipboardList },
];

export default function SellerSidebar({
  isApproved,
  shopName,
  collapsed,   // desktop collapse
  onToggle,    // desktop toggle
  mobileOpen,  // mobile drawer open
  onMobileClose,
}) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const active    = location.pathname.split("/seller/")[1] || "dashboard";

  const handleNav = (key) => {
    if (!isApproved && key !== "dashboard") return;
    navigate(`/seller/${key}`);
    onMobileClose?.();
  };

  const handleLogout = () => {
    localStorage.removeItem("sellerToken");
    navigate("/seller/auth");
  };

  // ── shared sidebar inner content ──────────────────────────────
  const SidebarContent = ({ isMobile }) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{
        padding: "16px 14px",
        borderBottom: "1px solid #e8f5e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        {(!collapsed || isMobile) && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: "linear-gradient(135deg,#3a7d1e,#6ab04c)",
              borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShoppingCart size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#2d5a1b", lineHeight: 1 }}>Gramin Cart</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Seller Portal</div>
            </div>
          </div>
        )}

        {/* Desktop toggle / Mobile close */}
        <button
          onClick={isMobile ? onMobileClose : onToggle}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#6b7280", padding: 4, borderRadius: 6,
            display: "flex", alignItems: "center",
            marginLeft: collapsed && !isMobile ? "auto" : 0,
            marginRight: collapsed && !isMobile ? "auto" : 0,
          }}
        >
          {isMobile ? <X size={20} /> : collapsed
            ? <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
            : <X size={18} />
          }
        </button>
      </div>

      {/* Shop badge */}
      {(!collapsed || isMobile) && shopName && (
        <div style={{
          margin: "12px 14px 0",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 8,
          padding: "8px 12px",
        }}>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>SHOP</div>
          <div style={{
            fontSize: 13, color: "#2d5a1b", fontWeight: 700,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{shopName}</div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          const isLocked = !isApproved && key !== "dashboard";
          return (
            <button
              key={key}
              onClick={() => handleNav(key)}
              disabled={isLocked}
              title={collapsed && !isMobile ? label : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 10,
                cursor: isLocked ? "not-allowed" : "pointer",
                border: "none",
                width: "100%",
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 600,
                transition: "background .15s, color .15s",
                opacity: isLocked ? 0.4 : 1,
                background: isActive
                  ? "linear-gradient(90deg,#e8f5e1,#d1fae5)"
                  : "transparent",
                color: isActive ? "#2d5a1b" : "#4b5563",
                boxShadow: isActive ? "inset 3px 0 0 #3a7d1e" : "none",
              }}
              onMouseEnter={e => {
                if (!isActive && !isLocked) {
                  e.currentTarget.style.background = "#f0fdf4";
                  e.currentTarget.style.color = "#2d5a1b";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#4b5563";
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {(!collapsed || isMobile) && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  {label}
                  {isLocked && <Lock size={11} style={{ opacity: 0.7 }} />}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 10px 20px", borderTop: "1px solid #e8f5e1" }}>
        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? "Logout" : ""}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", borderRadius: 10,
            cursor: "pointer", border: "none", width: "100%",
            textAlign: "left", fontFamily: "inherit",
            fontSize: 14, fontWeight: 600,
            background: "transparent", color: "#ef4444",
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        /* ── Mobile overlay backdrop ── */
        .sb-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,.35);
          z-index: 199;
          animation: fadeIn .2s ease;
        }
        /* ── Mobile drawer ── */
        .sb-mobile-drawer {
          display: none;
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 260px;
          background: #fff;
          border-right: 1px solid #e8f5e1;
          z-index: 200;
          overflow-y: auto;
          transition: transform .25s ease;
        }
        /* ── Desktop sidebar ── */
        .sb-desktop {
          display: flex;
          flex-direction: column;
          background: #fff;
          border-right: 1px solid #e8f5e1;
          position: sticky; top: 0;
          height: 100vh;
          overflow: hidden;
          flex-shrink: 0;
          transition: width .25s ease;
        }

        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideIn { from { transform:translateX(-100%) } to { transform:translateX(0) } }

        @media (max-width: 768px) {
          .sb-desktop { display: none !important; }
          .sb-mobile-drawer { display: block; }
          .sb-backdrop { display: block; }
        }
        @media (min-width: 769px) {
          .sb-mobile-drawer { display: none !important; }
          .sb-backdrop { display: none !important; }
        }
      `}</style>

      {/* ── Desktop sidebar ── */}
      <aside
        className="sb-desktop"
        style={{ width: collapsed ? 64 : 240 }}
      >
        <SidebarContent isMobile={false} />
      </aside>

      {/* ── Mobile drawer + backdrop ── */}
      {mobileOpen && (
        <>
          <div className="sb-backdrop" onClick={onMobileClose} />
          <div
            className="sb-mobile-drawer"
            style={{ animation: "slideIn .25s ease" }}
          >
            <SidebarContent isMobile={true} />
          </div>
        </>
      )}
    </>
  );
}