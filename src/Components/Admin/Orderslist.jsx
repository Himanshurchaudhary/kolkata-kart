// pages/admin/OrdersList.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Eye, RefreshCw, Search, Filter, X, ChevronLeft,
  ChevronRight, ChevronDown, Package, CreditCard,
  Banknote, Clock, CheckCircle, Truck, AlertCircle,
  Calendar, DollarSign, ArrowUpDown, RotateCcw, Store, SlidersHorizontal,
} from "lucide-react";
import OrderDetailModal from "./OrderDetailModal";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("adminToken");
const authHdr = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const DELIVERY_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
const PAYMENT_STATUSES  = ["Paid", "Pending", "Failed", "Refunded"];
const PAYMENT_METHODS   = ["COD", "Razorpay", "Stripe", "Card"];
const LIMIT = 20;

// ─── Color helpers ──────────────────────────────────────────────
const deliveryColor = (s) => ({
  Pending:    { bg: "#fef9c3", color: "#854d0e", border: "#fde047", left: "#eab308" },
  Processing: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", left: "#3b82f6" },
  Shipped:    { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd", left: "#8b5cf6" },
  Delivered:  { bg: "#dcfce7", color: "#166534", border: "#86efac", left: "#22c55e" },
  Cancelled:  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", left: "#ef4444" },
  Returned:   { bg: "#ffedd5", color: "#9a3412", border: "#fdba74", left: "#f97316" },
}[s] || { bg: "#f3f4f6", color: "#374151", border: "#d1d5db", left: "#9ca3af" });

const paymentColor = (s) => ({
  Paid:     { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  Pending:  { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  Failed:   { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  Refunded: { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
}[s] || { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" });

const rowBg = (s) => ({
  Pending:    "#fffef5",
  Processing: "#f5f8ff",
  Shipped:    "#f8f5ff",
  Delivered:  "#f5fdf7",
  Cancelled:  "#fff5f5",
  Returned:   "#fff8f3",
}[s] || "#fff");

// ─── Badges ─────────────────────────────────────────────────────
const StatusBadge = ({ label, type = "delivery" }) => {
  const c = type === "payment" ? paymentColor(label) : deliveryColor(label);
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
      border: `1px solid ${c.border}`, background: c.bg, color: c.color,
      whiteSpace: "nowrap", display: "inline-block",
    }}>{label}</span>
  );
};

const MethodIcon = ({ method }) =>
  method === "COD" ? <Banknote size={13} /> : <CreditCard size={13} />;

function FilterChip({ label, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px",
      background: "#f0fdf4", border: "1.5px solid #86efac",
      borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#16a34a",
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#16a34a", display: "flex", padding: 0, lineHeight: 1,
      }}>
        <X size={11} />
      </button>
    </span>
  );
}

// ─── Dropdown ───────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(p => !p)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "9px 13px",
        border: value ? "1.5px solid #16a34a" : "1.5px solid #e5e7eb",
        borderRadius: 10, background: value ? "#f0fdf4" : "#fff",
        cursor: "pointer", fontFamily: "inherit", fontSize: 13,
        fontWeight: 600, color: value ? "#16a34a" : "#374151", whiteSpace: "nowrap",
      }}>
        {Icon && <Icon size={14} />}
        {value || label}
        <ChevronDown size={13} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.13)", minWidth: 170, overflow: "hidden",
        }}>
          <div onClick={() => { onChange(""); setOpen(false); }} style={{
            padding: "10px 15px", cursor: "pointer", fontSize: 13,
            color: "#9ca3af", borderBottom: "1px solid #f3f4f6",
          }}>All</div>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{
              padding: "10px 15px", cursor: "pointer", fontSize: 13,
              fontWeight: value === opt ? 700 : 400,
              color: value === opt ? "#16a34a" : "#374151",
              background: value === opt ? "#f0fdf4" : "transparent",
            }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile Order Card ──────────────────────────────────────────
function OrderCard({ order, onView }) {
  const dc = deliveryColor(order.status);
  const pc = paymentColor(order.paymentStatus);
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,.06)",
      marginBottom: 10,
      display: "flex",
      borderLeft: `4px solid ${dc.left}`,
    }}>
      {/* Main content */}
      <div style={{ flex: 1, padding: "14px 14px 12px" }}>

        {/* Row 1: customer + amount */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
              {order.user?.fullName || order.shippingAddress?.name || "—"}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
              {order.user?.email}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
              ₹{parseFloat(order.total || 0).toFixed(2)}
            </div>
            {order.couponDiscount > 0 && (
              <div style={{ fontSize: 10, color: "#ef4444" }}>
                −{parseFloat(order.couponDiscount).toFixed(2)} off
              </div>
            )}
          </div>
        </div>

        {/* Row 2: shop + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <Store size={12} color="#16a34a" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#166534",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
            {order.shop_name || order.seller_name || "Direct Sale"}
          </span>
          <span style={{ color: "#e5e7eb", fontSize: 12 }}>·</span>
          <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </span>
        </div>

        {/* Row 3: status badges + method */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <StatusBadge label={order.status} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
            border: `1px solid ${pc.border}`, background: pc.bg, color: pc.color,
            whiteSpace: "nowrap", display: "inline-block",
          }}>{order.paymentStatus}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
            <MethodIcon method={order.paymentMethod} />
            {order.paymentMethod}
          </span>
        </div>
      </div>

      {/* View button — right side tap target */}
      <button onClick={() => onView(order)} style={{
        width: 52, flexShrink: 0, background: "#f0fdf4",
        border: "none", borderLeft: "1px solid #dcfce7",
        cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4,
        color: "#16a34a", fontFamily: "inherit",
      }}>
        <Eye size={16} />
        <span style={{ fontSize: 10, fontWeight: 700 }}>View</span>
      </button>
    </div>
  );
}

// ─── Table styles ────────────────────────────────────────────────
const TH = {
  padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#9ca3af",
  textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase",
  letterSpacing: "0.5px", borderBottom: "2px solid #f0f0f0",
  background: "#fafafa", userSelect: "none",
};
const TD = {
  padding: "13px 14px", fontSize: 13, color: "#374151",
  borderBottom: "1px solid #f5f5f5", verticalAlign: "middle",
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function OrdersList() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);

  const [search,         setSearch]         = useState("");
  const [searchInput,    setSearchInput]    = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [paymentStatus,  setPaymentStatus]  = useState("");
  const [paymentMethod,  setPaymentMethod]  = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [sortBy,         setSortBy]         = useState("createdAt");
  const [sortOrder,      setSortOrder]      = useState("desc");
  const [showFilters,    setShowFilters]    = useState(false);
  const [selectedOrder,  setSelectedOrder]  = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, sortBy, sortOrder });
      if (search)         params.set("search",        search.trim());
      if (deliveryStatus) params.set("status",         deliveryStatus);
      if (paymentStatus)  params.set("paymentStatus",  paymentStatus);
      if (paymentMethod)  params.set("paymentMethod",  paymentMethod);
      if (dateFrom)       params.set("dateFrom",       dateFrom);
      if (dateTo)         params.set("dateTo",         dateTo);
      const res  = await fetch(`${API_URL}/api/orders/admin/all?${params}`, { headers: authHdr() });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotal(data.total  || 0);
        setPages(data.pages  || 1);
      } else setError(data.message || "Failed to load orders");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [page, search, deliveryStatus, paymentStatus, paymentMethod, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const commitSearch = () => { setSearch(searchInput); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };
  const resetFilters = () => {
    setSearch(""); setSearchInput("");
    setDeliveryStatus(""); setPaymentStatus(""); setPaymentMethod("");
    setDateFrom(""); setDateTo("");
    setSortBy("createdAt"); setSortOrder("desc"); setPage(1);
  };
  const handleStatusUpdate = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
  };
  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(p => p === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("desc"); }
    setPage(1);
  };

  const totalRevenue  = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  const paidCount     = orders.filter(o => o.paymentStatus === "Paid").length;
  const pendingCount  = orders.filter(o => o.status === "Pending").length;
  const activeFilters = [deliveryStatus, paymentStatus, paymentMethod, dateFrom, dateTo].filter(Boolean).length;
  const hasAnyFilter  = !!(search || activeFilters);

  return (
    <div style={{ minHeight: "100vh", background: "#f2f4f2", fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity:0.5; cursor:pointer; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }

        .ord-row td { transition: background 0.1s; }
        .ord-row:hover td { filter: brightness(0.965); }

        /* responsive */
        .show-desktop { display: block !important; }
        .show-mobile  { display: none  !important; }
        @media (max-width: 700px) {
          .show-desktop { display: none  !important; }
          .show-mobile  { display: block !important; }
          .stat-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .filter-row   { flex-direction: column !important; }
          .filter-row > * { width: 100% !important; }
          .filter-row input { min-width: unset !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 14px 40px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#111827" }}>Orders</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9ca3af" }}>
              {total} total
            </p>
          </div>
          <button onClick={fetchOrders} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
            background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#374151",
          }}>
            <RefreshCw size={14} />
            <span className="show-desktop">Refresh</span>
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stat-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16,
        }}>
          {[
            { label: "Total",   value: total,                          icon: Package,     color: "#1a2332" },
            { label: "Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: DollarSign,  color: "#16a34a" },
            { label: "Paid",    value: paidCount,                      icon: CheckCircle, color: "#16a34a" },
            { label: "Pending", value: pendingCount,                   icon: Clock,       color: "#d97706" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 12, padding: "13px 14px",
              boxShadow: "0 1px 6px rgba(0,0,0,.05)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <s.icon size={16} color={s.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "12px 14px",
          boxShadow: "0 1px 6px rgba(0,0,0,.05)", marginBottom: 12,
        }}>
          <div className="filter-row" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search customer, order…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") commitSearch(); }}
                style={{
                  width: "100%", paddingLeft: 34, paddingRight: searchInput ? 34 : 12,
                  paddingTop: 10, paddingBottom: 10,
                  border: search ? "1.5px solid #16a34a" : "1.5px solid #e5e7eb",
                  borderRadius: 10, fontSize: 13, fontFamily: "inherit",
                  color: "#374151", outline: "none",
                  background: search ? "#f0fdf4" : "#fff",
                }}
              />
              {searchInput && (
                <button onClick={clearSearch} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: 0,
                }}>
                  <X size={13} />
                </button>
              )}
            </div>

            <button onClick={commitSearch} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "10px 16px",
              background: "#16a34a", border: "none", borderRadius: 10,
              cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              fontWeight: 700, color: "#fff", whiteSpace: "nowrap",
            }}>
              <Search size={14} /> Search
            </button>

            {/* Desktop dropdowns */}
            <div className="show-desktop" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Dropdown label="Delivery" options={DELIVERY_STATUSES} value={deliveryStatus}
                onChange={v => { setDeliveryStatus(v); setPage(1); }} icon={Truck} />
              <Dropdown label="Payment" options={PAYMENT_STATUSES} value={paymentStatus}
                onChange={v => { setPaymentStatus(v); setPage(1); }} icon={CreditCard} />
              <Dropdown label="Method" options={PAYMENT_METHODS} value={paymentMethod}
                onChange={v => { setPaymentMethod(v); setPage(1); }} icon={Banknote} />
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 13px",
              border: `1.5px solid ${showFilters || activeFilters > 0 ? "#16a34a" : "#e5e7eb"}`,
              borderRadius: 10, background: showFilters ? "#f0fdf4" : "#fff",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              fontWeight: 600, color: showFilters ? "#16a34a" : "#374151", whiteSpace: "nowrap",
              position: "relative",
            }}>
              <SlidersHorizontal size={14} />
              <span className="show-desktop">Filters</span>
              {activeFilters > 0 && (
                <span style={{
                  background: "#16a34a", color: "#fff", borderRadius: "50%",
                  width: 17, height: 17, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, fontWeight: 800,
                }}>{activeFilters}</span>
              )}
            </button>

            {hasAnyFilter && (
              <button onClick={resetFilters} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "9px 13px",
                border: "1.5px solid #fee2e2", borderRadius: 10, background: "#fef2f2",
                cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                fontWeight: 600, color: "#ef4444", whiteSpace: "nowrap",
              }}>
                <RotateCcw size={13} />
                <span className="show-desktop">Clear</span>
              </button>
            )}
          </div>

          {/* Expanded filters panel */}
          {showFilters && (
            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6",
              display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
            }}>
              {/* Mobile-only dropdowns */}
              <div className="show-mobile" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Dropdown label="Delivery" options={DELIVERY_STATUSES} value={deliveryStatus}
                  onChange={v => { setDeliveryStatus(v); setPage(1); }} icon={Truck} />
                <Dropdown label="Payment" options={PAYMENT_STATUSES} value={paymentStatus}
                  onChange={v => { setPaymentStatus(v); setPage(1); }} icon={CreditCard} />
                <Dropdown label="Method" options={PAYMENT_METHODS} value={paymentMethod}
                  onChange={v => { setPaymentMethod(v); setPage(1); }} icon={Banknote} />
              </div>

              {/* Date range */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Calendar size={14} color="#9ca3af" />
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>From</span>
                <input type="date" value={dateFrom} max={dateTo || undefined}
                  onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  style={{
                    padding: "7px 10px", fontSize: 13, fontFamily: "inherit", color: "#374151",
                    outline: "none", borderRadius: 9,
                    border: dateFrom ? "1.5px solid #16a34a" : "1.5px solid #e5e7eb",
                    background: dateFrom ? "#f0fdf4" : "#fff",
                  }} />
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>To</span>
                <input type="date" value={dateTo} min={dateFrom || undefined}
                  onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  style={{
                    padding: "7px 10px", fontSize: 13, fontFamily: "inherit", color: "#374151",
                    outline: "none", borderRadius: 9,
                    border: dateTo ? "1.5px solid #16a34a" : "1.5px solid #e5e7eb",
                    background: dateTo ? "#f0fdf4" : "#fff",
                  }} />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 10px",
                    border: "1.5px solid #fee2e2", borderRadius: 8, background: "#fef2f2",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "#ef4444",
                  }}>
                    <X size={12} /> Clear dates
                  </button>
                )}
              </div>

              {/* Sort */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ArrowUpDown size={14} color="#9ca3af" />
                <Dropdown label="Sort" options={["createdAt", "total", "orderNumber"]}
                  value={sortBy} onChange={v => { if (v) { setSortBy(v); setPage(1); } }} />
                <Dropdown label="Order" options={["desc", "asc"]}
                  value={sortOrder} onChange={v => { if (v) { setSortOrder(v); setPage(1); } }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Active Filter Chips ── */}
        {hasAnyFilter && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {search         && <FilterChip label={`"${search}"`}                  onRemove={clearSearch} />}
            {deliveryStatus && <FilterChip label={deliveryStatus}                  onRemove={() => { setDeliveryStatus(""); setPage(1); }} />}
            {paymentStatus  && <FilterChip label={paymentStatus}                   onRemove={() => { setPaymentStatus("");  setPage(1); }} />}
            {paymentMethod  && <FilterChip label={paymentMethod}                   onRemove={() => { setPaymentMethod("");  setPage(1); }} />}
            {dateFrom       && <FilterChip label={`From ${dateFrom}`}             onRemove={() => { setDateFrom("");       setPage(1); }} />}
            {dateTo         && <FilterChip label={`To ${dateTo}`}                 onRemove={() => { setDateTo("");         setPage(1); }} />}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            marginBottom: 12, fontSize: 13, color: "#ef4444",
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ══ MOBILE CARDS ══ */}
        <div className="show-mobile">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 14, marginBottom: 10,
                padding: 14, border: "1px solid #e5e7eb", borderLeft: "4px solid #e5e7eb",
              }}>
                {[70, 100, 55].map((w, j) => (
                  <div key={j} style={{
                    height: 12, background: "#f3f4f6", borderRadius: 4,
                    width: `${w}%`, marginBottom: 9,
                    animation: "pulse 1.4s ease-in-out infinite",
                  }} />
                ))}
              </div>
            ))
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>
              <Package size={40} style={{ opacity: 0.25, margin: "0 auto 12px" }} />
              <p style={{ margin: "0 0 14px", fontSize: 14 }}>No orders found</p>
              {hasAnyFilter && (
                <button onClick={resetFilters} style={{
                  padding: "9px 20px", background: "#f0fdf4",
                  border: "1.5px solid #86efac", borderRadius: 10, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#16a34a",
                }}>Clear filters</button>
              )}
            </div>
          ) : (
            orders.map(order => <OrderCard key={order.id} order={order} onView={setSelectedOrder} />)
          )}

          {/* Mobile pagination */}
          {pages > 1 && !loading && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                padding: "10px 18px", border: "1.5px solid #e5e7eb", borderRadius: 10,
                background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, fontWeight: 700, color: "#374151", opacity: page === 1 ? 0.4 : 1,
              }}>
                <ChevronLeft size={15} /> Prev
              </button>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 700 }}>{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} style={{
                padding: "10px 18px", border: "1.5px solid #e5e7eb", borderRadius: 10,
                background: "#fff", cursor: page === pages ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, fontWeight: 700, color: "#374151", opacity: page === pages ? 0.4 : 1,
              }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ══ DESKTOP TABLE ══ */}
        <div className="show-desktop">
          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr>
                    {[
                      { label: "Date",            field: "createdAt"  },
                      { label: "Seller / Shop",   field: null         },
                      { label: "Customer",        field: null         },
                      { label: "Total",           field: "total"      },
                      { label: "Delivery Status", field: "status"     },
                      { label: "Method",          field: null         },
                      { label: "Action",          field: null         },
                    ].map((col, i) => (
                      <th key={i}
                        style={{ ...TH, cursor: col.field ? "pointer" : "default" }}
                        onClick={col.field ? () => toggleSort(col.field) : undefined}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          {col.field && sortBy === col.field && (
                            <span style={{ color: "#16a34a", fontSize: 11 }}>
                              {sortOrder === "desc" ? "↓" : "↑"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={TD}>
                            <div style={{
                              height: 13, background: "#f3f4f6", borderRadius: 4,
                              width: j === 6 ? "40%" : "65%",
                              animation: "pulse 1.4s ease-in-out infinite",
                            }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...TD, textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                          <Package size={36} style={{ opacity: 0.25 }} />
                          <p style={{ margin: 0, fontSize: 14 }}>No orders found</p>
                          {hasAnyFilter && (
                            <button onClick={resetFilters} style={{
                              marginTop: 4, padding: "8px 18px", background: "#f0fdf4",
                              border: "1.5px solid #86efac", borderRadius: 9, cursor: "pointer",
                              fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#16a34a",
                            }}>Clear filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => {
                      const dc = deliveryColor(order.status);
                      const bg = rowBg(order.status);
                      const tdS = { ...TD, background: bg };
                      return (
                        <tr key={order.id} className="ord-row">

                          {/* Date */}
                          <td style={{ ...tdS, borderLeft: `3px solid ${dc.left}` }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>
                              {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          {/* Seller */}
                          <td style={tdS}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 8, background: "#f0fdf4",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <Store size={14} color="#16a34a" />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 12, color: "#166534" }}>
                                  {order.shop_name || order.seller_name || "Direct Sale"}
                                </div>
                                {order.seller_name && order.shop_name && (
                                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{order.seller_name}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Customer */}
                          <td style={tdS}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
                              {order.user?.fullName || order.shippingAddress?.name || "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {order.user?.email}
                            </div>
                          </td>

                          {/* Total */}
                          <td style={tdS}>
                            <div style={{ fontWeight: 900, fontSize: 14, color: "#111827" }}>
                              ₹{parseFloat(order.total || 0).toFixed(2)}
                            </div>
                            {order.couponDiscount > 0 && (
                              <div style={{ fontSize: 11, color: "#ef4444" }}>
                                −{parseFloat(order.couponDiscount).toFixed(2)} off
                              </div>
                            )}
                          </td>

                          {/* Delivery Status */}
                          <td style={tdS}>
                            <StatusBadge label={order.status} />
                          </td>

                          {/* Method */}
                          <td style={tdS}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                              <MethodIcon method={order.paymentMethod} />
                              {order.paymentMethod}
                            </span>
                          </td>

                          {/* Action */}
                          <td style={tdS}>
                            <button onClick={() => setSelectedOrder(order)} style={{
                              display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
                              background: "#f0fdf4", border: "1.5px solid #86efac",
                              borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                              fontSize: 12, fontWeight: 700, color: "#16a34a",
                            }}>
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Desktop pagination */}
            {pages > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderTop: "1px solid #f3f4f6", flexWrap: "wrap", gap: 10,
              }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} results
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                    padding: "7px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8,
                    background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", opacity: page === 1 ? 0.4 : 1,
                  }}><ChevronLeft size={15} /></button>
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    let p = i + 1;
                    if (pages > 5 && page > 3) p = page - 2 + i;
                    if (p > pages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)} style={{
                        width: 34, height: 34,
                        border: `1.5px solid ${page === p ? "#16a34a" : "#e5e7eb"}`,
                        borderRadius: 8, background: page === p ? "#16a34a" : "#fff",
                        color: page === p ? "#fff" : "#374151",
                        fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      }}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} style={{
                    padding: "7px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8,
                    background: "#fff", cursor: page === pages ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", opacity: page === pages ? 0.4 : 1,
                  }}><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}