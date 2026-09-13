import { useState, useEffect, useCallback } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── API helpers ─────────────────────────────────────────────────────────────
const apiFetchOrders = () =>
  fetch(`${API_URL}/api/orders/my`, { headers: authHeaders() }).then(r => r.json());
const apiFetchOrder = (id) =>
  fetch(`${API_URL}/api/orders/my/${id}`, { headers: authHeaders() }).then(r => r.json());
const apiCancelOrder = (id) =>
  fetch(`${API_URL}/api/orders/my/${id}/cancel`, { method: "PATCH", headers: authHeaders() }).then(r => r.json());

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

// App ke getDeliveryInfo se exactly match karta hai
const getDeliveryInfo = (estimatedDeliveryAt) => {
  if (!estimatedDeliveryAt) {
    return { dateStr: null, timeLeft: "Delivery soon", urgent: false };
  }

  // ✅ UTC force karo
  let raw = estimatedDeliveryAt;
  if (typeof raw === 'string' && !raw.endsWith('Z') && !raw.includes('+')) {
    raw = raw.replace(' ', 'T') + 'Z';
  }

  const target = new Date(raw);
  const now    = new Date();
  const diffMs = target - now;

  const dateStr = target.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

  if (diffMs <= 0) return { dateStr, timeLeft: "Delivery soon", urgent: false };

  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);
  const remHours  = diffHours % 24;
  const remMins   = diffMins % 60;

  let timeLeft = "";
  if (diffDays  > 0) timeLeft += `${diffDays}d `;
  if (remHours  > 0) timeLeft += `${remHours}h `;
  if (diffDays === 0 && remHours === 0 && remMins > 0) timeLeft += `${remMins}m `;

  if (!timeLeft.trim()) return { dateStr, timeLeft: "Delivery soon", urgent: false };

  return {
    dateStr,
    timeLeft: timeLeft.trim() + " left",
    urgent: diffDays === 0,
  };
};

// ─── Status & Tab config ──────────────────────────────────────────────────────
const STATUS_MAP = {
  Pending:      "Pending",
  Processing:   "Confirmed",
  Shipped:      "Pickup",
  "Picked Up":  "Pickup",
  "In Transit": "In Transit",
  "On The Way": "On The Way",
  Delivered:    "Delivered",
  Cancelled:    "Cancelled",
};

const TAB_STATUSES = {
  Pending:      ["Pending"],
  Confirmed:    ["Processing"],
  Pickup:       ["Shipped", "Picked Up"],
  "In Transit": ["In Transit"],
  "On The Way": ["On The Way"],
  Delivered:    ["Delivered"],
  Cancelled:    ["Cancelled"],
  All:          null,
};

const TAB_ORDER = [
  "Pending",
  "Confirmed",
  "Pickup",
  "In Transit",
  "On The Way",
  "Delivered",
  "Cancelled",
  "All",
];

const STEP_MAP = {
  "Picked Up": "Shipped",
  "In Transit": "Shipped",
};

const statusColor = (s) => {
  const map = {
    Pending:      { bg: "#fef3c7", color: "#92400e" },
    Processing:   { bg: "#dbeafe", color: "#1e40af" },
    Confirmed:    { bg: "#dbeafe", color: "#1e40af" },
    Shipped:      { bg: "#ccfbf1", color: "#0f766e" },
    "Picked Up":  { bg: "#ccfbf1", color: "#0f766e" },
    "In Transit": { bg: "#e0e7ff", color: "#3730a3" },
    "On The Way": { bg: "#ffedd5", color: "#9a3412" },
    Delivered:    { bg: "#dcfce7", color: "#166534" },
    Cancelled:    { bg: "#fee2e2", color: "#991b1b" },
    Returned:     { bg: "#f1f5f9", color: "#475569" },
  };
  return map[s] || { bg: "#f1f5f9", color: "#475569" };
};

const toTabLabel = (status) => STATUS_MAP[status] || status;

// ─── useIsMobile ──────────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spin = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "ohSpin 0.7s linear infinite", display: "block" }}>
    <path d="M12 2a10 10 0 0110 10" />
  </svg>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      background: type === "success" ? "#166534" : "#991b1b",
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
      animation: "ohFadeIn 0.25s ease", whiteSpace: "nowrap",
      maxWidth: "calc(100vw - 32px)",
    }}>
      {message}
    </div>
  );
};

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const STEPS = ["Pending", "Processing", "Shipped", "On The Way", "Delivered"];
const STEP_LABELS = ["Order Placed", "Confirmed", "Picked Up", "On The Way", "Delivered"];

const OrderStepper = ({ status }) => {
  const isMobile = useIsMobile();
  const displayStatus = STEP_MAP[status] || status;
  if (displayStatus === "Cancelled" || displayStatus === "Returned") return null;
  const currentIdx = STEPS.indexOf(displayStatus);

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "4px 0" }}>
        {STEPS.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done || active ? "#16a34a" : "#e5e7eb",
                  border: active ? "3px solid #bbf7d0" : "none",
                  boxShadow: active ? "0 0 0 4px rgba(22,163,74,0.15)" : "none",
                }}>
                  {done
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? "#fff" : "#9ca3af" }} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 2, height: 28, background: done ? "#16a34a" : "#e5e7eb" }} />
                )}
              </div>
              <div style={{ paddingTop: 4 }}>
                <span style={{
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "#16a34a" : done ? "#374151" : "#9ca3af",
                }}>
                  {STEP_LABELS[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "24px 0", overflowX: "auto", padding: "0 4px" }}>
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 0, gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done || active ? "#16a34a" : "#e5e7eb",
                border: active ? "3px solid #bbf7d0" : "none",
                transition: "all 0.3s",
                boxShadow: active ? "0 0 0 4px rgba(22,163,74,0.15)" : "none",
              }}>
                {done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : <div style={{ width: 10, height: 10, borderRadius: "50%", background: active ? "#fff" : "#9ca3af" }} />}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? "#16a34a" : done ? "#374151" : "#9ca3af",
                whiteSpace: "nowrap", textAlign: "center",
              }}>
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 3, background: done ? "#16a34a" : "#e5e7eb",
                margin: "0 4px", marginBottom: 20, transition: "background 0.3s", minWidth: 16,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Summary Row ──────────────────────────────────────────────────────────────
const SummaryRow = ({ label, value, valueColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", padding: "5px 0" }}>
    <span>{label}</span>
    <span style={{ fontWeight: 600, color: valueColor || "#374151" }}>{value}</span>
  </div>
);

// ─── ORDER DETAIL VIEW ────────────────────────────────────────────────────────
const OrderDetail = ({ order, onBack, onCancel, cancelling }) => {
  const isMobile = useIsMobile();
  const sc = statusColor(order.status);
  const addr = order.shippingAddress || {};
  const driver = order.assignedDriver;
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const delivery = getDeliveryInfo(order.estimatedDeliveryAt);

  const handleDownloadInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/api/invoice/${order.id}/user/invoice?download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order.orderNumber || order.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download invoice. Please try again.");
    } finally { setInvoiceLoading(false); }
  };

  const handleDownloadReceipt = async () => {
    setReceiptLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/api/receipt/${order.id}/user/receipt?download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt-${order.orderNumber || order.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("Failed to download receipt"); }
    finally { setReceiptLoading(false); }
  };

  const fullAddr = [addr.house, addr.road, addr.landmark, addr.city, addr.state, addr.pincode]
    .filter(Boolean).join(", ");

  return (
    <div style={{ animation: "ohFadeUp 0.3s ease" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "1.5px solid #e5e7eb", borderRadius: 10,
          padding: isMobile ? "7px 10px" : "7px 14px",
          fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer", fontFamily: "inherit",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {!isMobile && "Back"}
        </button>
        <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#111" }}>Order Details</h1>
      </div>

      {/* Order ID + status */}
      <div style={{
        background: "#fff", borderRadius: 16,
        padding: isMobile ? "14px 16px" : "18px 22px",
        marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#2563eb" }}>
              Order ID#{order.orderNumber || order.id?.slice(-8).toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Placed on <strong style={{ color: "#374151" }}>{fmtDate(order.createdAt)}</strong>
            </div>

            {/* ✅ Delivery badge — hamesha dikho (Delivery soon ya countdown) */}
            {order.status !== "Delivered" && order.status !== "Cancelled" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {delivery.dateStr && (
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Est. delivery <strong style={{ color: "#374151" }}>{delivery.dateStr}</strong>
                  </span>
                )}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: delivery.urgent ? "#fffbeb" : "#f0fdf4",
                  border: `1px solid ${delivery.urgent ? "#fcd34d" : "#86efac"}`,
                  color: delivery.urgent ? "#b45309" : "#15803d",
                }}>
                  {delivery.urgent ? "⚠️" : "🕐"} {delivery.timeLeft}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
              background: sc.bg, color: sc.color,
            }}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{
        background: "#fff", borderRadius: 16,
        padding: isMobile ? "14px 16px" : "18px 22px",
        marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}>
        <OrderStepper status={order.status} />
        {(order.status === "Cancelled" || order.status === "Returned") && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", background: "#fef2f2",
            borderRadius: 10, border: "1px solid #fecaca",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
              This order has been {order.status.toLowerCase()}.
              {order.cancelledAt && ` (${fmtDate(order.cancelledAt)})`}
            </span>
          </div>
        )}
      </div>

      {/* 2-col layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
        gap: 12, alignItems: "start",
      }}>

        {/* Products */}
        <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 16px" : "18px 22px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>
            Products ({order.items?.length || 0})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {(order.items || []).map((item, i) => (
              <div key={item.id || i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0",
                borderBottom: i < order.items.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <div style={{
                  width: isMobile ? 50 : 60, height: isMobile ? 50 : 60,
                  borderRadius: 10, overflow: "hidden", background: "#f9fafb",
                  flexShrink: 0, border: "1px solid #f0f0f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 22 }}>📦</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#111",
                    marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {item.quantity} × ₹{Number(item.price || 0).toFixed(2)}
                  </div>
                  {/* ✅ Variant badge */}
                  {item.variantLabel && (
                    <span style={{
                      display: "inline-block", marginTop: 4,
                      fontSize: 11, fontWeight: 700, color: "#16a34a",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      padding: "2px 8px", borderRadius: 5,
                    }}>
                      {item.variantLabel}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111", flexShrink: 0 }}>
                  ₹{Number(item.total || (item.price * item.quantity) || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Order Summary */}
          <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 16px" : "18px 22px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Order Summary</h3>
            <SummaryRow label="Items" value={order.items?.reduce((s, i) => s + i.quantity, 0) || 0} />
            <SummaryRow label="Subtotal" value={`₹${Number(order.subtotal || 0).toFixed(2)}`} />
            <SummaryRow label="Discount" value={`-₹${Number(order.discount || 0).toFixed(2)}`} valueColor="#ef4444" />
            <SummaryRow label="Shipping Charge" value={`₹${Number(order.shippingCharge || 0).toFixed(2)}`} />
            {order.tax > 0 && <SummaryRow label="Tax" value={`₹${Number(order.tax).toFixed(2)}`} />}
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Total Amount</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>₹{Number(order.total || 0).toFixed(2)}</span>
            </div>

            {/* Payment Method */}
            <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.6px", marginBottom: 6, textTransform: "uppercase" }}>
                Payment Method
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#111" }}>
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                  background: order.paymentStatus === "Paid" ? "#dcfce7" : "#fef3c7",
                  color: order.paymentStatus === "Paid" ? "#16a34a" : "#d97706",
                }}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Download Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button onClick={handleDownloadReceipt} disabled={receiptLoading}
                style={{
                  flex: 1, padding: "9px 13px", background: receiptLoading ? "#1e40af" : "#1d4ed8",
                  color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700,
                  cursor: receiptLoading ? "not-allowed" : "pointer", opacity: receiptLoading ? 0.75 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit", minHeight: 38, whiteSpace: "nowrap",
                }}>
                {receiptLoading ? "Generating…" : "🧾 Download Receipt"}
              </button>
              <button onClick={handleDownloadInvoice} disabled={invoiceLoading}
                style={{
                  flex: 1, padding: "9px 13px", background: invoiceLoading ? "#166534" : "#15803d",
                  color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700,
                  cursor: invoiceLoading ? "not-allowed" : "pointer", opacity: invoiceLoading ? 0.75 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "inherit", minHeight: 38, whiteSpace: "nowrap",
                }}>
                {invoiceLoading ? <><Spin size={13} /> Downloading…</> : "⬇ Download Invoice"}
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 16px" : "18px 22px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111" }}>Delivery Address</h3>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, color: "#111" }}>{addr.name}</div>
              <div style={{ color: "#6b7280" }}>{addr.phone}{addr.altPhone ? `, ${addr.altPhone}` : ""}</div>
              <div style={{ color: "#6b7280" }}>{fullAddr}</div>
            </div>
          </div>

          {/* Delivery Agent */}
          {(order.status === "On The Way" || order.status === "Delivered") && (
            <div style={{
              background: "#fff", borderRadius: 16,
              padding: isMobile ? "14px 16px" : "18px 22px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1.5px solid #bbf7d0",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111" }}>Delivery Agent</h3>
              {driver ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", background: "#f0fdf4",
                    border: "2px solid #16a34a", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0, fontSize: 20,
                  }}>🧑‍🦯</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {driver.fullName || driver.name || "Agent"}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{driver.phone || "—"}</div>
                    {driver.vehicleType && (
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                        {driver.vehicleType} {driver.vehicleNumber ? `· ${driver.vehicleNumber}` : ""}
                      </div>
                    )}
                  </div>
                  {driver.phone && (
                    <a href={`tel:${driver.phone}`} style={{
                      flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                      background: "#16a34a", display: "flex", alignItems: "center",
                      justifyContent: "center", color: "#fff", textDecoration: "none",
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.06 1.2 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91A16 16 0 0016.09 17.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#9ca3af" }}>Assigning a delivery agent…</div>
              )}
            </div>
          )}

          {/* Cancel Order */}
          {["Pending", "Processing"].includes(order.status) && (
            <button onClick={() => onCancel(order.id)} disabled={cancelling} style={{
              width: "100%", padding: "13px 0",
              background: cancelling ? "#fee2e2" : "#fff",
              color: "#ef4444", border: "1.5px solid #fca5a5",
              borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: cancelling ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, transition: "background 0.15s",
            }}>
              {cancelling ? <><Spin size={14} /> Cancelling…</> : "Cancel Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Order List Item ──────────────────────────────────────────────────────────
const OrderListItem = ({ order, onView }) => {
  const isMobile = useIsMobile();
  const sc = statusColor(order.status);
  const qty = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  const displayId = order.orderNumber || order.id?.slice(-8).toUpperCase();

  if (isMobile) {
    return (
      <div style={{
        background: "#fff", borderRadius: 14, padding: "14px 16px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0",
        animation: "ohFadeIn 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>
            Order ID#{displayId}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, flexShrink: 0,
            background: sc.bg, color: sc.color,
          }}>
            {toTabLabel(order.status)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
          Placed on <span style={{ color: "#6b7280", fontWeight: 600 }}>{fmtDate(order.createdAt)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>QTY: {qty}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
              ₹<span style={{ color: "#16a34a" }}>{Number(order.total || 0).toFixed(2)}</span>
            </span>
          </div>
          <button onClick={() => onView(order.id)} style={{
            background: "#f0fdf4", border: "none", color: "#16a34a",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            padding: "6px 14px", borderRadius: 8,
          }}>
            View Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "18px 22px",
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0",
      animation: "ohFadeIn 0.3s ease", transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"}>
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#2563eb", marginBottom: 4 }}>
          Order ID#{displayId}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          Placed on <span style={{ color: "#6b7280", fontWeight: 600 }}>{fmtDate(order.createdAt)}</span>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", flexShrink: 0 }}>QTY: {qty}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", flexShrink: 0 }}>
        Amount: <span style={{ color: "#16a34a" }}>₹{Number(order.total || 0).toFixed(2)}</span>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, flexShrink: 0,
        background: sc.bg, color: sc.color,
      }}>
        {toTabLabel(order.status)}
      </span>
      <button onClick={() => onView(order.id)} style={{
        background: "none", border: "none", color: "#2563eb",
        fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        flexShrink: 0, padding: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
        onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
        View Details
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function OrderHistoryTab() {
  const isMobile = useIsMobile();

  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("Pending");
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoad,  setDetailLoad]  = useState(false);
  const [cancelling,  setCancelling]  = useState(false);
  const [toast,       setToast]       = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchOrders();
      setOrders(Array.isArray(data) ? data : data?.orders || []);
    } catch {
      setToast({ message: "Failed to load orders", type: "error" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleView = async (id) => {
    setDetailLoad(true);
    try {
      const data = await apiFetchOrder(id);
      setDetailOrder(data?.order || null);
    } catch {
      setToast({ message: "Failed to load order details", type: "error" });
    } finally { setDetailLoad(false); }
  };

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      const data = await apiCancelOrder(id);
      if (data?.success) {
        setDetailOrder(data.order);
        setOrders(prev => prev.map(o => o.id === id ? data.order : o));
        setToast({ message: "Order cancelled successfully", type: "success" });
      } else {
        setToast({ message: data?.message || "Cannot cancel this order", type: "error" });
      }
    } catch {
      setToast({ message: "Something went wrong", type: "error" });
    } finally { setCancelling(false); }
  };

  const tabCounts = TAB_ORDER.reduce((acc, tab) => {
    const statuses = TAB_STATUSES[tab];
    acc[tab] = statuses
      ? orders.filter(o => statuses.includes(o.status)).length
      : orders.length;
    return acc;
  }, {});

  const visibleOrders = (() => {
    const statuses = TAB_STATUSES[activeTab];
    if (!statuses) return orders;
    return orders.filter(o => statuses.includes(o.status));
  })();

  if (detailLoad) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12, color: "#9ca3af" }}>
        <Spin size={24} /> Loading order…
      </div>
    );
  }

  if (detailOrder) {
    return (
      <>
        <style>{baseStyles}</style>
        <OrderDetail
          order={detailOrder}
          onBack={() => setDetailOrder(null)}
          onCancel={handleCancel}
          cancelling={cancelling}
        />
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      <style>{baseStyles}</style>

      <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>
        Order History
      </h1>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "2px solid #e5e7eb",
        marginBottom: 18,
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}>
        {TAB_ORDER.map(tab => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: isMobile ? "9px 12px" : "10px 16px",
              border: "none", background: "none", cursor: "pointer",
              fontSize: isMobile ? 12 : 13,
              fontWeight: active ? 700 : 500,
              color: active ? "#16a34a" : "#6b7280",
              borderBottom: active ? "2.5px solid #16a34a" : "2.5px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap", fontFamily: "inherit",
              transition: "color 0.15s", flexShrink: 0,
            }}>
              {tab} ({tabCounts[tab] || 0})
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: "#fff", borderRadius: 14,
              padding: isMobile ? "14px 16px" : "18px 22px",
              display: "flex", gap: 16, border: "1px solid #f0f0f0",
            }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 14, width: "40%", background: "#f0f0f0", borderRadius: 4, animation: "ohPulse 1.4s ease-in-out infinite" }} />
                <div style={{ height: 11, width: "25%", background: "#f0f0f0", borderRadius: 4, animation: "ohPulse 1.4s ease-in-out infinite" }} />
              </div>
              <div style={{ height: 28, width: 80, background: "#f0f0f0", borderRadius: 20, animation: "ohPulse 1.4s ease-in-out infinite" }} />
            </div>
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 14, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>No {activeTab === "All" ? "" : activeTab} orders</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Orders in this category will appear here.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visibleOrders.map(order => (
            <OrderListItem key={order.id} order={order} onView={handleView} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const baseStyles = `
  @keyframes ohFadeIn  { from { opacity:0; transform:translateY(6px);  } to { opacity:1; transform:translateY(0); } }
  @keyframes ohFadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ohPulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes ohSpin    { to { transform:rotate(360deg); } }
  ::-webkit-scrollbar  { display: none; }
`;