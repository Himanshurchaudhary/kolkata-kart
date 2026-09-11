// src/Seller/SellerMyOrders.jsx
import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, RefreshCw, Search, X,
  ChevronDown, ChevronUp, Package,
  Clock, Truck, CheckCircle, XCircle,
  RotateCcw, AlertCircle, MapPin, Filter,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("sellerToken");

const authFetch = (url, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

const toINR = (v) => `₹${Number(v || 0).toFixed(2)}`;

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  Pending:      { color: "#b45309", bg: "#fef9c3", border: "#fde68a", icon: Clock },
  Processing:   { color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe", icon: AlertCircle },
  Shipped:      { color: "#6d28d9", bg: "#ede9fe", border: "#ddd6fe", icon: Truck },
  "On The Way": { color: "#be185d", bg: "#fce7f3", border: "#fbcfe8", icon: Truck },
  Delivered:    { color: "#15803d", bg: "#dcfce7", border: "#86efac", icon: CheckCircle },
  Completed:    { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: CheckCircle },
  Cancelled:    { color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", icon: XCircle },
  Returned:     { color: "#9a3412", bg: "#ffedd5", border: "#fdba74", icon: RotateCcw },
};

const PAY_CFG = {
  Paid:     { color: "#15803d", bg: "#dcfce7" },
  Pending:  { color: "#b45309", bg: "#fef9c3" },
  Failed:   { color: "#991b1b", bg: "#fee2e2" },
  Refunded: { color: "#6d28d9", bg: "#ede9fe" },
};

// ── Badges ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { color: "#374151", bg: "#f3f4f6", border: "#e5e7eb" };
  const Icon = cfg.icon || Clock;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border || cfg.bg}`,
      borderRadius: 99, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <Icon size={10} />
      {status}
    </span>
  );
}

function PayBadge({ status }) {
  const cfg = PAY_CFG[status] || { color: "#374151", bg: "#f3f4f6" };
  return (
    <span style={{
      display: "inline-block",
      background: cfg.bg, color: cfg.color,
      borderRadius: 99, padding: "2px 9px",
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ── Order Detail Sheet ─────────────────────────────────────────────────────
function OrderSheet({ order, onClose }) {
  const addr = order.shippingAddress || {};

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
      <div style={{
        background: "#f5f7f5",
        borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 560,
        maxHeight: "92vh", overflowY: "auto",
        animation: "sheetUp .28s cubic-bezier(.22,.61,.36,1)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#d1d5db" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px 14px",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>Order Details</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{order.orderNumber}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={order.status} />
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#fff", border: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}>
              <X size={14} color="#6b7280" />
            </button>
          </div>
        </div>

        <div style={{ padding: "0 14px 40px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Summary */}
          <div style={card}>
            <div style={cardTitle}>📋 Order Summary</div>
            <InfoRow label="Order ID"     value={order.orderNumber} />
            <InfoRow label="Date"         value={fmt(order.createdAt)} />
            <InfoRow label="Payment"      value={order.paymentMethod} />
            <div style={rowBase}>
              <span style={labelStyle}>Pay Status</span>
              <PayBadge status={order.paymentStatus || "—"} />
            </div>
            {order.couponCode && (
              <InfoRow label="Coupon" value={order.couponCode} color="#16a34a" />
            )}
          </div>

          {/* Products */}
          <div style={card}>
            <div style={cardTitle}>📦 Products Ordered</div>
            {(order.items || []).map((item, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "10px 0",
                borderBottom: i < order.items.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10, overflow: "hidden",
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Package size={20} color="#d1d5db" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 3 }}>
                    {item.name}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {item.variantLabel && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "#16a34a",
                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                        padding: "1px 7px", borderRadius: 99,
                      }}>{item.variantLabel}</span>
                    )}
                    <span style={{
                      fontSize: 10, color: "#9ca3af",
                      background: "#f3f4f6", padding: "1px 7px", borderRadius: 99,
                    }}>
                      Qty {item.quantity} · {item.unit || "PCS"}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>
                    {toINR(item.total)}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>
                    {toINR(item.price)}/unit
                  </div>
                </div>
              </div>
            ))}

            {/* Bill */}
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 10, paddingTop: 10 }}>
              {[
                { label: "Subtotal",        value: toINR(order.subtotal) },
                { label: "Coupon Discount", value: `-₹${Number(order.couponDiscount || 0).toFixed(2)}` },
                { label: "Delivery Charge", value: toINR(order.shippingCharge) },
                { label: "Tax",             value: toINR(order.tax) },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 12, color: "#6b7280", padding: "3px 0",
                }}>
                  <span>{r.label}</span>
                  <span style={{ fontWeight: 500, color: "#374151" }}>{r.value}</span>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 15, fontWeight: 800, color: "#1a1a1a",
                borderTop: "2px solid #e5e7eb", marginTop: 8, paddingTop: 10,
              }}>
                <span>Grand Total</span>
                <span style={{ color: "#16a34a" }}>{toINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery City only — NO customer name/phone/email */}
          <div style={card}>
            <div style={cardTitle}>📍 Delivery Location</div>
            <InfoRow label="City"    value={addr.city} />
            <InfoRow label="State"   value={addr.state} />
            <InfoRow label="Pincode" value={addr.pincode} />
            <InfoRow label="Type"    value={addr.type} />
            <div style={{
              marginTop: 8, padding: "8px 10px",
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 8, fontSize: 11, color: "#92400e",
            }}>
              🔒 Customer contact details are not shared with sellers.
            </div>
          </div>

          {/* Delivery estimate if set */}
          {order.estimatedDeliveryAt && (
            <div style={card}>
              <div style={cardTitle}>🕐 Estimated Delivery</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
                {new Date(order.estimatedDeliveryAt).toLocaleString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit", hour12: true,
                })}
              </div>
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div style={card}>
              <div style={cardTitle}>📊 Status Timeline</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 4 }}>
                {order.statusHistory.map((h, i) => {
                  const cfg = STATUS_CFG[h.status] || { color: "#374151", bg: "#f3f4f6" };
                  const isLast = i === order.statusHistory.length - 1;
                  return (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {/* Line + dot */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%", marginTop: 4,
                          background: isLast ? cfg.color : "#d1d5db",
                          border: `2px solid ${isLast ? cfg.color : "#e5e7eb"}`,
                          flexShrink: 0,
                        }} />
                        {!isLast && (
                          <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 16, marginTop: 2 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 12, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isLast ? cfg.color : "#374151" }}>
                          {h.status}
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>
                          {h.changedAt ? new Date(h.changedAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short",
                            hour: "2-digit", minute: "2-digit", hour12: true,
                          }) : "—"}
                        </div>
                        {h.note && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{h.note}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note */}
          {order.note && (
            <div style={card}>
              <div style={cardTitle}>📝 Customer Note</div>
              <div style={{
                fontSize: 13, color: "#374151", lineHeight: 1.7,
                background: "#fffbeb", borderRadius: 8, padding: "10px 12px",
                border: "1px solid #fde68a",
              }}>
                {order.note}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const card = {
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,.04)",
};
const cardTitle = {
  fontSize: 12, fontWeight: 800, color: "#374151",
  padding: "10px 14px", borderBottom: "1px solid #f0f0f0",
  background: "#fafafa",
};
const rowBase = {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", padding: "7px 14px",
  borderBottom: "1px solid #f9f9f9", gap: 10,
};
const labelStyle = { fontSize: 11, color: "#9ca3af", flexShrink: 0 };

function InfoRow({ label, value, color }) {
  if (!value || value === "—") return null;
  return (
    <div style={rowBase}>
      <span style={labelStyle}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || "#1a1a1a", textAlign: "right", wordBreak: "break-word", maxWidth: "65%" }}>
        {value}
      </span>
    </div>
  );
}

// ── Order Card (list item) ─────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
  const itemCount = order.items?.length || 0;
  const firstItem = order.items?.[0];

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        transition: "box-shadow .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.04)"}
    >
      {/* Top row */}
      <div style={{ padding: "12px 14px 10px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* Product thumbnail */}
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          overflow: "hidden", background: "#f3f4f6",
          border: "1px solid #e5e7eb", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {firstItem?.image
            ? <img src={firstItem.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Package size={20} color="#d1d5db" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: "#6b7280",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: "60%",
            }}>
              {order.orderNumber}
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginTop: 2 }}>
            {firstItem?.name || "—"}
            {itemCount > 1 && (
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}> +{itemCount - 1} more</span>
            )}
          </div>

          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {fmt(order.createdAt)} · {order.paymentMethod}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px 12px",
        borderTop: "1px solid #f5f5f5",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>
            {toINR(order.total)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <PayBadge status={order.paymentStatus} />
            <span style={{ fontSize: 10, color: "#9ca3af" }}>
              · {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 12, fontWeight: 600, color: "#3a7d1e",
        }}>
          View details
          <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: "all",         label: "All" },
  { key: "Pending",     label: "Pending" },
  { key: "Processing",  label: "Processing" },
  { key: "Shipped",     label: "Shipped" },
  { key: "On The Way",  label: "On Way" },
  { key: "Delivered",   label: "Delivered" },
  { key: "Completed",   label: "Completed" },
  { key: "Cancelled",   label: "Cancelled" },
  { key: "Returned",    label: "Returned" },
];

export default function SellerMyOrders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [tab,         setTab]         = useState("all");
  const [selected,    setSelected]    = useState(null);
  const [error,       setError]       = useState("");

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res  = await authFetch("/api/seller/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
      else setError(data.message || "Failed to load orders");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Stats
  const stats = {
    total:      orders.length,
    revenue:    orders.filter(o => ["Delivered","Completed"].includes(o.status))
                      .reduce((s, o) => s + Number(o.total || 0), 0),
    pending:    orders.filter(o => o.status === "Pending").length,
    delivered:  orders.filter(o => ["Delivered","Completed"].includes(o.status)).length,
  };

  // Filter
  const visible = orders.filter(o => {
    const matchTab    = tab === "all" || o.status === tab;
    const matchSearch = !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some(i => i.name?.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  // Tab counts
  const tabCount = (key) => key === "all"
    ? orders.length
    : orders.filter(o => o.status === key).length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 12, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: 24, height: 24,
        border: "3px solid #e5e7eb", borderTopColor: "#3a7d1e",
        borderRadius: "50%", animation: "spin .7s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 13, color: "#9ca3af" }}>Loading your orders…</span>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && orders.length === 0) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 12, padding: "24px 16px", textAlign: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <AlertCircle size={36} color="#dc2626" />
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{error}</div>
      <button
        onClick={() => fetchOrders()}
        style={{
          background: "#3a7d1e", color: "#fff",
          border: "none", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f7f5",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { display: none }
      `}</style>

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Title */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 10px",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>
              My Orders
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
              {stats.total} order{stats.total !== 1 ? "s" : ""} from your shop
            </p>
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={15} color="#3a7d1e"
              style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }}
            />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0, borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0",
        }}>
          {[
            { label: "Total Orders", value: stats.total,                   color: "#374151" },
            { label: "Pending",      value: stats.pending,                  color: "#b45309" },
            { label: "Delivered",    value: stats.delivered,                color: "#15803d" },
            { label: "Revenue",      value: `₹${Math.round(stats.revenue)}`, color: "#16a34a" },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} style={{
              padding: "10px 4px", textAlign: "center",
              borderRight: i < arr.length - 1 ? "1px solid #f0f0f0" : "none",
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: "10px 16px 0", position: "relative" }}>
          <Search size={13} color="#9ca3af" style={{
            position: "absolute", left: 27, top: "50%", transform: "translateY(-30%)",
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or product name…"
            style={{
              width: "100%", padding: "9px 32px 9px 32px",
              border: "1px solid #e5e7eb", borderRadius: 10,
              fontSize: 12, outline: "none",
              background: "#f9fafb", boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 26, top: "50%", transform: "translateY(-30%)",
                background: "none", border: "none", cursor: "pointer", display: "flex",
              }}
            >
              <X size={13} color="#9ca3af" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto",
          padding: "10px 16px", scrollbarWidth: "none",
        }}>
          {TABS.map(({ key, label }) => {
            const count  = tabCount(key);
            const active = tab === key;
            const cfg    = STATUS_CFG[key] || {};
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: "6px 12px", borderRadius: 99, flexShrink: 0,
                  border: active
                    ? `1.5px solid ${cfg.color || "#3a7d1e"}`
                    : "1.5px solid #e5e7eb",
                  background: active ? (cfg.color || "#3a7d1e") : "#fff",
                  color: active ? "#fff" : "#6b7280",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "inherit",
                }}
              >
                {label}
                <span style={{
                  background: active ? "rgba(255,255,255,.25)" : "#f3f4f6",
                  color: active ? "#fff" : "#9ca3af",
                  borderRadius: 99, padding: "0 5px",
                  fontSize: 9, fontWeight: 800,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px 40px" }}>
        {visible.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: 260, gap: 10, textAlign: "center",
          }}>
            <ShoppingBag size={40} color="#e5e7eb" />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#6b7280" }}>
              {search ? "No orders match your search" : "No orders yet"}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              {search ? "Try a different keyword" : "Orders from your products will appear here"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelected(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Sheet ───────────────────────────────────────────────────── */}
      {selected && (
        <OrderSheet
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}