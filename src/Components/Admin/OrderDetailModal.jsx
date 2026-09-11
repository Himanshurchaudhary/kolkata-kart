// OrderDetailModal.jsx
import { useState, useEffect } from "react";

const toINR = (val) => `₹${Number(val || 0).toFixed(2)}`;
const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("adminToken");
const authHdr = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const DELIVERY_STATUSES = [
  "Pending", "Processing", "Shipped",
  "On The Way", "Delivered", "Completed", "Cancelled", "Returned",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

// ── Status colors ────────────────────────────────────────────
const statusStyle = (s) => ({
  Pending:      { bg: "#fef9c3", color: "#854d0e" },
  Processing:   { bg: "#dbeafe", color: "#1e40af" },
  Shipped:      { bg: "#ede9fe", color: "#5b21b6" },
  Delivered:    { bg: "#dcfce7", color: "#166534" },
  Completed:    { bg: "#d1fae5", color: "#065f46" },
  Cancelled:    { bg: "#fee2e2", color: "#991b1b" },
  "On The Way": { bg: "#fce7f3", color: "#db2777" },
  Returned:     { bg: "#ffedd5", color: "#9a3412" },
}[s] || { bg: "#f3f4f6", color: "#374151" });

const payStyle = (s) => ({
  Paid:      { bg: "#dcfce7", color: "#166534" },
  Pending:   { bg: "#fef9c3", color: "#854d0e" },
  Failed:    { bg: "#fee2e2", color: "#991b1b" },
  Refunded:  { bg: "#ede9fe", color: "#5b21b6" },
  Complete:  { bg: "#d1fae5", color: "#065f46" },
}[s] || { bg: "#f3f4f6", color: "#374151" });

function Badge({ label, type = "delivery" }) {
  const s = type === "payment" ? payStyle(label) : statusStyle(label);
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700,
      padding: "4px 12px", borderRadius: 99,
      display: "inline-block", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── Section Card ─────────────────────────────────────────────
function Section({ emoji, title, children, accent }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${accent || "#e5e7eb"}`,
      overflow: "hidden",
      marginBottom: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
    }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${accent || "#f0f0f0"}`,
        background: accent ? `${accent}18` : "#fafafa",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>{title}</span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Info Row ─────────────────────────────────────────────────
function Row({ label, value, bold, color, hide }) {
  if (hide || !value || value === "—" || value === "") return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", gap: 12,
      padding: "7px 0",
      borderBottom: "1px solid #f5f5f5",
    }}>
      <span style={{ color: "#9ca3af", fontSize: 12, flexShrink: 0, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{
        fontWeight: bold ? 700 : 500,
        color: color || "#1a1a1a",
        fontSize: 13, textAlign: "right",
        wordBreak: "break-word", maxWidth: "65%",
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Estimate helper ──────────────────────────────────────────
function getDeliveryEstimate(val) {
  if (!val) return null;
  const target = new Date(val);
  const diffMs = target - new Date();
  const dateStr = target.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  if (diffMs <= 0) return { label: "Overdue", dateStr, overdue: true, urgent: false };
  const mins  = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  let t = "";
  if (days  > 0) t += `${days}d `;
  if (hours % 24 > 0) t += `${hours % 24}h `;
  if (days === 0 && mins % 60 > 0) t += `${mins % 60}m`;
  return { label: t.trim() + " remaining", dateStr, overdue: false, urgent: days === 0 };
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function OrderDetailModal({ order: init, onClose, onStatusUpdate }) {
  const [order,     setOrder]     = useState(init);
  const [fetching,  setFetching]  = useState(true);
  const [newStatus, setNewStatus] = useState(init?.status || "");
  const [payStatus, setPayStatus] = useState(init?.paymentStatus || "");
  const [updating,  setUpdating]  = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [taxList,   setTaxList]   = useState([]);
  const [estDays,   setEstDays]   = useState("");
  const [estHours,  setEstHours]  = useState("");
  const [estMins,   setEstMins]   = useState("");
  const [estSaving, setEstSaving] = useState(false);
  const [estMsg,    setEstMsg]    = useState("");

  // Fetch full order
  useEffect(() => {
    if (!init?.id) return;
    setFetching(true);
    fetch(`${API_URL}/api/orders/admin/${init.id}`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.order) {
          setOrder(d.order);
          setNewStatus(d.order.status);
          setPayStatus(d.order.paymentStatus);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [init?.id]);

  // Fetch taxes
  useEffect(() => {
    fetch(`${API_URL}/api/taxes/active-rate`)
      .then(r => r.json())
      .then(d => { if (d.success) setTaxList(d.taxes || []); })
      .catch(() => {});
  }, []);

  // ESC close
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Status update ────────────────────────────────────────
  const handleStatusUpdate = async () => {
    setUpdating(true); setStatusMsg("");
    try {
      const res  = await fetch(`${API_URL}/api/orders/admin/${order.id}/status`, {
        method: "PATCH", headers: authHdr(),
        body: JSON.stringify({ status: newStatus, paymentStatus: payStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(p => ({ ...p, status: newStatus, paymentStatus: payStatus }));
        setStatusMsg("success");
        onStatusUpdate?.(order.id, newStatus);
      } else {
        setStatusMsg("error:" + (data.message || "Update failed"));
      }
    } catch { setStatusMsg("error:Network error"); }
    finally   { setUpdating(false); }
  };

  // ── Estimate save ────────────────────────────────────────
  const handleSetEstimate = async () => {
    const d = Number(estDays) || 0;
    const h = Number(estHours) || 0;
    const m = Number(estMins) || 0;
    if (!d && !h && !m) { setEstMsg("error:Enter at least 1 minute"); return; }
    const target = new Date();
    target.setDate(target.getDate() + d);
    target.setHours(target.getHours() + h);
    target.setMinutes(target.getMinutes() + m);
    setEstSaving(true); setEstMsg("");
    try {
      const res  = await fetch(`${API_URL}/api/orders/admin/${order.id}/delivery-estimate`, {
        method: "PATCH", headers: authHdr(),
        body: JSON.stringify({ estimatedDeliveryAt: target.toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(p => ({ ...p, estimatedDeliveryAt: target.toISOString() }));
        setEstMsg("success");
        setEstDays(""); setEstHours(""); setEstMins("");
      } else { setEstMsg("error:" + (data.message || "Failed")); }
    } catch { setEstMsg("error:Network error"); }
    finally   { setEstSaving(false); }
  };

  const addr = order?.shippingAddress || {};
  const est  = getDeliveryEstimate(order?.estimatedDeliveryAt);

  // Tax calculation
  const taxable = Math.max(0,
    Number(order?.subtotal || 0) - Number(order?.couponDiscount || 0)
  );

  // Hide estimate section for terminal statuses
  const hideEstimate = ["Delivered", "Completed", "Cancelled", "Returned"].includes(order?.status);

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes slideUp { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
        .odm-pill { transition: all .15s; }
        .odm-pill:active { transform: scale(.95); }
        .pay-pill { transition: all .15s; cursor: pointer; }
        .pay-pill:active { transform: scale(.95); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,.6)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Bottom Sheet */}
        <div style={{
          background: "#f4f6f4",
          borderRadius: "22px 22px 0 0",
          width: "100%", maxWidth: 620,
          maxHeight: "94vh",
          overflowY: "auto",
          animation: "slideUp .3s cubic-bezier(.22,.61,.36,1)",
        }}>

          {/* ── Drag handle ── */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: "#d1d5db" }} />
          </div>

          {/* ── Sticky header ── */}
          <div style={{
            position: "sticky", top: 0, zIndex: 20,
            background: "#f4f6f4",
            padding: "10px 16px 12px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 10,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
                Order Details
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                {order?.orderNumber}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {order?.status && <Badge label={order.status} />}
              <button
                onClick={onClose}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "#fff", border: "1px solid #e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 16, color: "#6b7280",
                  flexShrink: 0,
                }}
              >✕</button>
            </div>
          </div>

          {/* ── Fetching indicator ── */}
          {fetching && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "8px 0 4px", fontSize: 12, color: "#9ca3af",
            }}>
              <div style={{
                width: 13, height: 13,
                border: "2px solid #e5e7eb", borderTopColor: "#16a34a",
                borderRadius: "50%", animation: "spin .7s linear infinite",
              }} />
              Loading full details…
            </div>
          )}

          {/* ── Content ── */}
          <div style={{ padding: "4px 14px 48px" }}>

            {/* ══ 1. SELLER ══ */}
            <Section emoji="🏪" title="Seller Details" accent="#16a34a">
              {(order?.shop_name || order?.seller_name) ? (
                <>
                  <Row label="Shop"      value={order?.shop_name}     bold color="#166534" />
                  <Row label="Category"  value={order?.shop_category} />
                  <Row label="Seller"    value={order?.seller_name} />
                  <Row label="Email"     value={order?.seller_email} />
                  <Row label="Mobile"    value={order?.seller_mobile} />
                  <Row label="Street"    value={order?.shop_street} />
                  <Row label="City"      value={order?.shop_city} />
                  <Row label="State"     value={order?.shop_state} />
                  <Row label="Pincode"   value={order?.shop_pincode} />
                  <Row label="UPI ID"    value={order?.upi_id} />
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "8px 0" }}>
                  Direct sale — no seller linked
                </div>
              )}
            </Section>

            {/* ══ 2. ORDER SUMMARY ══ */}
            <Section emoji="🧾" title="Order Summary">
              <Row label="Order ID"   value={order?.orderNumber} />
              <Row label="Date"       value={order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—"} />
              <Row label="Payment"    value={order?.paymentMethod} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>Pay Status</span>
                <Badge label={order?.paymentStatus || "—"} type="payment" />
              </div>
              {order?.couponCode && (
                <Row label="Coupon" value={order.couponCode} color="#16a34a" />
              )}
              {order?.paymentMethod === "COD" && order?.status === "Delivered" && order?.paymentStatus !== "Paid" && (
                <div style={{
                  marginTop: 8, background: "#fffbeb",
                  border: "1px solid #fcd34d", borderRadius: 8,
                  padding: "8px 12px", fontSize: 12, color: "#92400e", fontWeight: 600,
                }}>
                  ⚠️ COD not yet collected by driver
                </div>
              )}
            </Section>

            {/* ══ 3. PRODUCTS ══ */}
            <Section emoji="📦" title="Products">
              {order?.items?.length ? (
                <>
                  {order.items.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      padding: "10px 0",
                      borderBottom: i < order.items.length - 1 ? "1px solid #f0f0f0" : "none",
                    }}>
                      {/* Image */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 12,
                        overflow: "hidden", background: "#f3f4f6",
                        flexShrink: 0, border: "1px solid #e5e7eb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 22 }}>📦</span>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                          {item.name}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(item.variantLabel || item.variant?.label) && (
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: "#16a34a", background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              padding: "2px 9px", borderRadius: 99,
                            }}>
                              {item.variantLabel || item.variant?.label}
                            </span>
                          )}
                          <span style={{
                            fontSize: 11, color: "#9ca3af",
                            background: "#f3f4f6", padding: "2px 8px", borderRadius: 99,
                          }}>
                            Qty {item.quantity} · {item.unit || "PCS"}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>
                          ₹{Number(item.total || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          ₹{Number(item.price || 0).toFixed(2)}/unit
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ── Bill ── */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                    {[
                      { label: "Subtotal",        value: toINR(order?.subtotal) },
                      { label: "Coupon Discount", value: `-₹${Number(order?.couponDiscount || 0).toFixed(2)}` },
                      { label: "Delivery Charge", value: toINR(order?.shippingCharge) },
                    ].map((r, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: 13, color: "#6b7280", padding: "4px 0",
                      }}>
                        <span>{r.label}</span>
                        <span style={{ fontWeight: 500, color: "#374151" }}>{r.value}</span>
                      </div>
                    ))}

                    {/* Tax rows */}
                    {taxList.length === 0 ? (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", padding: "4px 0" }}>
                        <span>Tax</span>
                        <span style={{ fontWeight: 500, color: "#374151" }}>{toINR(order?.tax)}</span>
                      </div>
                    ) : taxList.map((t, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", padding: "4px 0" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {t.taxName}
                          <span style={{ fontSize: 10, background: "#e5e7eb", color: "#374151", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                            {t.percentage}%
                          </span>
                        </span>
                        <span style={{ fontWeight: 500, color: "#374151" }}>
                          ₹{((taxable * Number(t.percentage)) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {/* Grand Total */}
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 16, fontWeight: 800, color: "#1a1a1a",
                      borderTop: "2px solid #e5e7eb",
                      marginTop: 10, paddingTop: 12,
                    }}>
                      <span>Grand Total</span>
                      <span style={{ color: "#16a34a" }}>{toINR(order?.total)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "16px 0" }}>
                  {fetching ? "Loading…" : "No items found"}
                </div>
              )}
            </Section>

            {/* ══ 4. CUSTOMER ══ */}
            <Section emoji="👤" title="Customer Info">
              <Row label="Name"  value={order?.user?.fullName || addr.name} bold />
              <Row label="Phone" value={order?.user?.phone    || addr.phone} />
              <Row label="Email" value={order?.user?.email} />
            </Section>

            {/* ══ 5. ADDRESS ══ */}
            <Section emoji="📍" title="Delivery Address">
              <Row label="Name"     value={addr.name} bold />
              <Row label="Phone"    value={addr.phone} />
              <Row label="House"    value={addr.house} />
              <Row label="Road"     value={addr.road} />
              <Row label="City"     value={addr.city} />
              <Row label="State"    value={addr.state} />
              <Row label="Pincode"  value={addr.pincode} />
              <Row label="Landmark" value={addr.landmark} />
              <Row label="Type"     value={addr.type} />
            </Section>

            {/* ══ 6. UPDATE STATUS ══ */}
            <Section emoji="🔄" title="Update Status" accent="#2563eb">

              {/* Delivery Status pills */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Delivery Status
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {DELIVERY_STATUSES.map(s => {
                    const active = newStatus === s;
                    const sc = statusStyle(s);
                    return (
                      <button
                        key={s}
                        className="odm-pill"
                        onClick={() => { setNewStatus(s); setStatusMsg(""); }}
                        style={{
                          padding: "7px 14px", borderRadius: 99,
                          fontSize: 12, fontWeight: 700,
                          cursor: "pointer", border: "none",
                          fontFamily: "inherit",
                          background: active ? sc.color : "#f3f4f6",
                          color: active ? "#fff" : "#6b7280",
                          boxShadow: active ? `0 2px 8px ${sc.color}55` : "none",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Status pills */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Payment Status
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {PAYMENT_STATUSES.map(s => {
                    const active = payStatus === s;
                    const pc = payStyle(s);
                    return (
                      <button
                        key={s}
                        className="pay-pill"
                        onClick={() => { setPayStatus(s); setStatusMsg(""); }}
                        style={{
                          padding: "7px 14px", borderRadius: 99,
                          fontSize: 12, fontWeight: 700,
                          border: "none", fontFamily: "inherit",
                          background: active ? pc.color : "#f3f4f6",
                          color: active ? "#fff" : "#6b7280",
                          boxShadow: active ? `0 2px 8px ${pc.color}55` : "none",
                        }}
                      >
                        {s === "Paid" ? "✓ Paid" : s}
                      </button>
                    );
                  })}
                </div>

                {/* Quick payment complete banner */}
                {payStatus === "Paid" && (
                  <div style={{
                    marginTop: 10,
                    background: "#f0fdf4", border: "1px solid #86efac",
                    borderRadius: 10, padding: "10px 14px",
                    fontSize: 12, color: "#166534", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>✅</span> Payment marked as complete
                  </div>
                )}
                {payStatus === "Refunded" && (
                  <div style={{
                    marginTop: 10,
                    background: "#f5f3ff", border: "1px solid #c4b5fd",
                    borderRadius: 10, padding: "10px 14px",
                    fontSize: 12, color: "#5b21b6", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>↩️</span> Refund issued to customer
                  </div>
                )}
                {payStatus === "Failed" && (
                  <div style={{
                    marginTop: 10,
                    background: "#fef2f2", border: "1px solid #fca5a5",
                    borderRadius: 10, padding: "10px 14px",
                    fontSize: 12, color: "#991b1b", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>❌</span> Payment failed — follow up with customer
                  </div>
                )}
              </div>

              {/* COD warning */}
              {order?.paymentMethod === "COD" &&
               (order?.status === "Delivered" || newStatus === "Delivered" || newStatus === "Completed") &&
               payStatus !== "Paid" && (
                <div style={{
                  marginBottom: 14, background: "#fffbeb",
                  border: "1px solid #fcd34d", borderRadius: 10,
                  padding: "10px 14px", fontSize: 12, color: "#92400e", fontWeight: 600,
                }}>
                  ⚠️ COD order — mark payment as <strong>Paid</strong> after cash collection
                </div>
              )}

              {/* Completed order summary banner */}
              {(newStatus === "Completed" || order?.status === "Completed") && (
                <div style={{
                  marginBottom: 14,
                  background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                  border: "1px solid #6ee7b7",
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", gap: 12, alignItems: "center",
                }}>
                  <span style={{ fontSize: 28 }}>🎉</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46" }}>Order Completed</div>
                    <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                      Delivered & payment received. This order is fully closed.
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {statusMsg === "success" && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#166534", fontWeight: 600, marginBottom: 12 }}>
                  ✓ Order updated successfully
                </div>
              )}
              {statusMsg.startsWith?.("error:") && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#991b1b", fontWeight: 600, marginBottom: 12 }}>
                  ✗ {statusMsg.slice(6)}
                </div>
              )}

              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                style={{
                  width: "100%", padding: "14px",
                  background: updating
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #16a34a, #22c55e)",
                  color: "#fff", border: "none", borderRadius: 14,
                  fontSize: 15, fontWeight: 700,
                  cursor: updating ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: updating ? "none" : "0 4px 14px rgba(22,163,74,.35)",
                }}
              >
                {updating ? (
                  <>
                    <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                    Updating…
                  </>
                ) : "✓ Save Status"}
              </button>
            </Section>

            {/* ══ 7. DELIVERY ESTIMATE ══ */}
            {!hideEstimate && (
              <Section emoji="🕐" title="Delivery Estimate">

                {/* Current estimate */}
                {est && (
                  <div style={{
                    background: est.overdue ? "#fef2f2" : est.urgent ? "#fffbeb" : "#f0fdf4",
                    border: `1px solid ${est.overdue ? "#fca5a5" : est.urgent ? "#fcd34d" : "#86efac"}`,
                    borderRadius: 12, padding: "14px 16px", marginBottom: 16,
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.5px",
                      color: est.overdue ? "#991b1b" : est.urgent ? "#92400e" : "#166534",
                      marginBottom: 4,
                    }}>
                      {est.overdue ? "⚠️ OVERDUE" : est.urgent ? "⚡ DUE TODAY" : "✅ ON TRACK"}
                    </div>
                    <div style={{
                      fontSize: 20, fontWeight: 800,
                      color: est.overdue ? "#dc2626" : est.urgent ? "#b45309" : "#15803d",
                      marginBottom: 4,
                    }}>
                      {est.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>📅 {est.dateStr}</div>
                  </div>
                )}

                {/* Quick presets */}
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                  Set new estimate:
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
                  {[
                    { label: "30m",    d: 0, h: 0, m: 30 },
                    { label: "2 hrs",  d: 0, h: 2, m: 0  },
                    { label: "1 day",  d: 1, h: 0, m: 0  },
                    { label: "2 days", d: 2, h: 0, m: 0  },
                    { label: "3 days", d: 3, h: 0, m: 0  },
                  ].map(p => (
                    <button
                      key={p.label}
                      className="odm-pill"
                      onClick={() => { setEstDays(String(p.d)); setEstHours(String(p.h)); setEstMins(String(p.m)); setEstMsg(""); }}
                      style={{
                        padding: "7px 16px", fontSize: 12, fontWeight: 700,
                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                        borderRadius: 99, cursor: "pointer",
                        color: "#166634", fontFamily: "inherit",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Manual inputs */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: "Days",  val: estDays,  set: setEstDays,  max: 30 },
                    { label: "Hours", val: estHours, set: setEstHours, max: 23 },
                    { label: "Mins",  val: estMins,  set: setEstMins,  max: 59 },
                  ].map(({ label, val, set, max }) => (
                    <div key={label} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" }}>
                        {label}
                      </div>
                      <input
                        type="number" min="0" max={max}
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="0"
                        style={{
                          width: "100%", padding: "12px 4px",
                          textAlign: "center",
                          border: "1.5px solid #e5e7eb", borderRadius: 12,
                          fontSize: 22, fontWeight: 800, color: "#1a1a1a",
                          fontFamily: "inherit", outline: "none",
                          background: "#f9fafb",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {estMsg === "success" && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#166534", fontWeight: 600, marginBottom: 12 }}>
                    ✓ Estimate saved
                  </div>
                )}
                {estMsg.startsWith?.("error:") && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#991b1b", fontWeight: 600, marginBottom: 12 }}>
                    ✗ {estMsg.slice(6)}
                  </div>
                )}

                <button
                  onClick={handleSetEstimate}
                  disabled={estSaving}
                  style={{
                    width: "100%", padding: "14px",
                    background: estSaving ? "#9ca3af" : "#2563eb",
                    color: "#fff", border: "none", borderRadius: 14,
                    fontSize: 15, fontWeight: 700,
                    cursor: estSaving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: estSaving ? "none" : "0 4px 14px rgba(37,99,235,.35)",
                  }}
                >
                  {estSaving ? (
                    <>
                      <div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                      Saving…
                    </>
                  ) : "💾 Save Estimate"}
                </button>
              </Section>
            )}

            {/* ══ 8. CUSTOMER NOTE ══ */}
            {order?.note && (
              <Section emoji="📝" title="Customer Note">
                <div style={{
                  fontSize: 13, color: "#374151", lineHeight: 1.8,
                  background: "#fffbeb", borderRadius: 10, padding: "12px 14px",
                  border: "1px solid #fde68a",
                }}>
                  {order.note}
                </div>
              </Section>
            )}

          </div>
        </div>
      </div>
    </>
  );
}