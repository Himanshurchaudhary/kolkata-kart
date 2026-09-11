// pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Users, Truck, Package,
  CreditCard, Banknote, CheckCircle, Clock, XCircle,
  RefreshCw, ArrowUpRight, ArrowDownRight, Zap,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("adminToken");
const authHdr = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const apiFetch = async (path) => {
  const res = await fetch(`${API_URL}/api/dashboard${path}`, { headers: authHdr() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  emerald:  "#10b981",
  emeraldL: "#d1fae5",
  blue:     "#3b82f6",
  blueL:    "#dbeafe",
  violet:   "#8b5cf6",
  violetL:  "#ede9fe",
  amber:    "#f59e0b",
  amberL:   "#fef3c7",
  rose:     "#f43f5e",
  roseL:    "#ffe4e6",
  slate:    "#0f172a",
  muted:    "#64748b",
  border:   "#f1f5f9",
  surface:  "#ffffff",
  bg:       "#f8fafc",
};

const PIE_COLORS = [C.emerald, C.blue, C.violet, C.amber, C.rose];

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtINR  = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  const [year, month, day] = d.split('-');
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const fmtDT   = (d) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skel = ({ h = 20, w = "100%", r = 8 }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
  }} />
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.surface, borderRadius: 16,
    border: `1px solid ${C.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
    ...style,
  }}>
    {children}
  </div>
);

// ─── Section title ────────────────────────────────────────────────────────────
const SectionTitle = ({ title, sub, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
    <div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.slate }}>{title}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, colorL, trend, loading }) {
  return (
    <Card>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </p>
            {loading
              ? <Skel h={32} w="70%" />
              : <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.slate, lineHeight: 1 }}>{value}</p>
            }
            {sub && !loading && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>{sub}</p>
            )}
          </div>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: colorL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={20} color={color} strokeWidth={2} />
          </div>
        </div>
        {trend !== undefined && !loading && (
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 700,
            color: trend >= 0 ? C.emerald : C.rose,
          }}>
            {trend >= 0
              ? <ArrowUpRight size={14} />
              : <ArrowDownRight size={14} />
            }
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Custom tooltip for charts ────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.slate, borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", minWidth: 140,
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", fontSize: 13, fontWeight: 700, color: p.color || "#fff" }}>
          {p.name}: {p.name?.includes("Revenue") || p.name === "revenue" || p.name === "collected"
            ? fmtINR(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const statusCfg = {
  Delivered:   { bg: "#dcfce7", color: "#166534" },
  Pending:     { bg: "#fef9c3", color: "#854d0e" },
  Processing:  { bg: "#dbeafe", color: "#1e40af" },
  Cancelled:   { bg: "#fee2e2", color: "#991b1b" },
  Shipped:     { bg: "#ede9fe", color: "#5b21b6" },
  "In Transit":{ bg: "#e0f2fe", color: "#075985" },
  "On The Way":{ bg: "#fce7f3", color: "#9d174d" },
};
const SBadge = ({ label }) => {
  const c = statusCfg[label] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 5,
      background: c.bg, color: c.color, whiteSpace: "nowrap",
    }}>{label}</span>
  );
};

// ─── Payment badge ────────────────────────────────────────────────────────────
const PayBadge = ({ method, mode, status }) => {
  const isCOD = method === "COD";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{
        fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
        background: isCOD ? C.amberL : C.violetL,
        color: isCOD ? "#92400e" : "#5b21b6",
        display: "inline-flex", alignItems: "center", gap: 3, width: "fit-content",
      }}>
        {isCOD ? "💵" : "💳"} {method}
      </span>
      {isCOD && status === "Paid" && mode && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
          background: mode === "Cash" ? C.emeraldL : C.blueL,
          color: mode === "Cash" ? "#166534" : "#1e40af",
          width: "fit-content",
        }}>
          {mode === "Cash" ? "💵 Cash" : "📱 Online"}
        </span>
      )}
      {isCOD && status !== "Paid" && (
        <span style={{ fontSize: 9, fontWeight: 700, color: C.amber }}>⚠ Uncollected</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminLay() {
  const [stats,       setStats]       = useState(null);
  const [revenue,     setRevenue]     = useState([]);
  const [ordersChart, setOrdersChart] = useState([]);
  const [payBreak,    setPayBreak]    = useState(null);
  const [recent,      setRecent]      = useState([]);
  const [topProds,    setTopProds]    = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [days,        setDays]        = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, oc, pb, re, tp, dr] = await Promise.allSettled([
        apiFetch("/stats"),
        apiFetch(`/revenue-chart?days=${days}`),
        apiFetch(`/orders-chart?days=${days}`),
        apiFetch("/payment-breakdown"),
        apiFetch("/recent-orders?limit=8"),
        apiFetch("/top-products?limit=5"),
        apiFetch("/driver-stats"),
      ]);

      if (s.status  === "fulfilled") setStats(s.value.stats);
      if (r.status  === "fulfilled") setRevenue(r.value.chart);
      if (oc.status === "fulfilled") {
        console.log("RAW orders chart:", oc.value.chart);  // ← add karo
        setOrdersChart(oc.value.chart);
      }
      
      if (oc.status === "fulfilled") setOrdersChart(oc.value.chart);
      if (pb.status === "fulfilled") setPayBreak(pb.value);
      if (re.status === "fulfilled") setRecent(re.value.orders);
      if (tp.status === "fulfilled") setTopProds(tp.value.products);
      if (dr.status === "fulfilled") setDrivers(dr.value.drivers);
      setLastRefresh(new Date());
    } catch { }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const summaryCards = stats ? [
    {
      label: "Total Revenue",
      value: fmtINR(stats.revenue.total),
      sub:   `${fmtINR(stats.revenue.collected)} collected`,
      icon:  TrendingUp, color: C.emerald, colorL: C.emeraldL,
    },
    {
      label: "Total Orders",
      value: stats.orders.total,
      sub:   `${stats.orders.delivered} delivered`,
      icon:  ShoppingBag, color: C.blue, colorL: C.blueL,
    },
    {
      label: "Customers",
      value: stats.customers,
      sub:   "Registered users",
      icon:  Users, color: C.violet, colorL: C.violetL,
    },
    {
      label: "Avg Order Value",
      value: fmtINR(stats.revenue.avgOrder),
      sub:   "Per delivered order",
      icon:  CreditCard, color: C.amber, colorL: C.amberL,
    },
    {
      label: "Active Deliveries",
      value: stats.orders.active,
      sub:   `${stats.drivers.online} drivers online`,
      icon:  Truck, color: C.rose, colorL: C.roseL,
    },
    {
      label: "Pending Orders",
      value: stats.orders.pending,
      sub:   `${stats.orders.processing} processing`,
      icon:  Clock, color: C.amber, colorL: C.amberL,
    },
  ] : [];

  // Pie data for payment methods
  const pieData = payBreak?.methods?.map(m => ({
    name: m.method, value: m.count, revenue: m.revenue,
  })) || [];

  // COD mode pie
  const codPieData = payBreak?.codModes?.map(c => ({
    name: c.mode === "Cash" ? "💵 Cash" : "📱 Online",
    value: c.count,
  })) || [];

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.emerald}, #059669)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={18} color="#fff" />
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.slate }}>Dashboard</h1>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
              Last updated: {lastRefresh.toLocaleTimeString("en-IN")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Day selector */}
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding: "7px 14px", borderRadius: 8, border: "1.5px solid",
                borderColor: days === d ? C.emerald : C.border,
                background: days === d ? C.emeraldL : C.surface,
                color: days === d ? "#166534" : C.muted,
                fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>
                {d}d
              </button>
            ))}
            <button onClick={load} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              background: C.slate, border: "none", borderRadius: 9,
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><div style={{ padding: "20px 22px" }}><Skel h={80} /></div></Card>
            ))
            : summaryCards.map((c, i) => <StatCard key={i} {...c} loading={false} />)
          }
        </div>

        {/* ── Order status mini-strip ── */}
        {stats && (
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Delivered",   val: stats.orders.delivered,  color: C.emerald },
              { label: "Processing",  val: stats.orders.processing, color: C.blue    },
              { label: "Active",      val: stats.orders.active,     color: C.violet  },
              { label: "Cancelled",   val: stats.orders.cancelled,  color: C.rose    },
              { label: "COD Cash",    val: stats.cod.cashCount,     color: C.amber   },
              { label: "COD Online",  val: stats.cod.onlineCount,   color: C.blue    },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 120,
                background: C.surface, borderRadius: 10,
                border: `1px solid ${C.border}`,
                padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.slate }}>{s.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Charts Row 1: Revenue + Orders ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Revenue Area Chart */}
          <Card>
            <SectionTitle title="Revenue Overview" sub={`Last ${days} days`} />
            <div style={{ padding: "16px 8px 8px" }}>
              {loading ? <Skel h={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenue} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.emerald} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.emerald} stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} width={50} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="revenue"   name="Revenue"   stroke={C.emerald} strokeWidth={2} fill="url(#revGrad)" dot={false} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke={C.blue}    strokeWidth={2} fill="url(#colGrad)" dot={false} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Orders Stacked Bar Chart */}
          <Card>
            <SectionTitle title="Orders by Status" sub={`Last ${days} days`} />

            <div style={{ padding: "16px 8px 8px" }}>
              {loading ? <Skel h={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ordersChart} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="Delivered"  stackId="a" fill={C.emerald} radius={[0,0,0,0]} maxBarSize={32} />
                    <Bar dataKey="Processing" stackId="a" fill={C.blue}    maxBarSize={32} />
                    <Bar dataKey="Pending"    stackId="a" fill={C.amber}   maxBarSize={32} />
                    <Bar dataKey="Shipped"    stackId="a" fill={C.violet}  maxBarSize={32} />  {/* ← add */}

                    <Bar dataKey="Cancelled"  stackId="a" fill={C.rose}    radius={[4,4,0,0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* ── Charts Row 2: Payment Pie + COD Pie ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Payment Method Distribution */}
          <Card>
            <SectionTitle title="Payment Methods" sub="Paid orders only" />
            <div style={{ padding: "12px 20px 20px", display: "flex", alignItems: "center", gap: 20 }}>
              {loading ? <Skel h={180} /> : (
                <>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n, p) => [v + " orders", p.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {pieData.map((d, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 0", borderBottom: i < pieData.length - 1 ? `1px solid ${C.border}` : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>{d.name}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.slate }}>{d.value}</p>
                          <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{fmtINR(d.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* COD Collection Mode */}
          <Card>
            <SectionTitle title="COD Collection Mode" sub="How drivers collected cash" />
            <div style={{ padding: "12px 20px 20px" }}>
              {loading ? <Skel h={180} /> : (
                <>
                  {/* Big numbers */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Cash Collections",   count: stats?.cod.cashCount,     rev: stats?.cod.cashRevenue,   color: C.emerald, colorL: C.emeraldL, icon: "💵" },
                      { label: "Online Collections",  count: stats?.cod.onlineCount,   rev: stats?.cod.onlineRevenue, color: C.blue,    colorL: C.blueL,    icon: "📱" },
                    ].map((s, i) => (
                      <div key={i} style={{
                        padding: "14px", borderRadius: 12,
                        background: s.colorL, border: `1px solid ${s.color}33`,
                      }}>
                        <p style={{ margin: "0 0 4px", fontSize: 20 }}>{s.icon}</p>
                        <p style={{ margin: "0 0 2px", fontSize: 11, color: C.muted, fontWeight: 600 }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: s.color }}>{s.count || 0}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{fmtINR(s.rev)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini pie */}
                  {codPieData.length > 0 && (
                    <ResponsiveContainer width="100%" height={90}>
                      <PieChart>
                        <Pie data={codPieData} cx="50%" cy="50%" outerRadius={40}
                          dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                          labelLine={false}
                          style={{ fontSize: 10 }}>
                          <Cell fill={C.emerald} />
                          <Cell fill={C.blue}    />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* ── Bottom Row: Recent Orders + Top Products + Drivers ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Recent Orders Table */}
          <Card>
            <SectionTitle title="Recent Orders" sub="Latest 8 orders" />
            <div style={{ padding: "12px 0 0", overflowX: "auto" }}>
              {loading ? (
                <div style={{ padding: "0 20px 20px" }}>
                  {Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={36} style={{ marginBottom: 8 }} />)}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {["Order", "Customer", "Total", "Status", "Payment"].map(h => (
                        <th key={h} style={{
                          padding: "8px 16px", fontSize: 10, fontWeight: 800,
                          color: C.muted, textAlign: "left", textTransform: "uppercase",
                          letterSpacing: "0.05em", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o, i) => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px 16px" }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.slate }}>
                            #{o.orderNumber?.slice(-6)}
                          </p>
                          <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{fmtDT(o.createdAt)}</p>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.slate }}>
                            {o.customerName || "—"}
                          </p>
                          <p style={{ margin: 0, fontSize: 10, color: C.muted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.city}
                          </p>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: C.slate }}>{fmtINR(o.total)}</span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <SBadge label={o.status} />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <PayBadge method={o.paymentMethod} mode={o.codPaymentMode} status={o.paymentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Right column: Top Products + Drivers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Top Products */}
            <Card>
              <SectionTitle title="Top Products" sub="By revenue — delivered orders" />
              <div style={{ padding: "12px 20px 16px" }}>
                {loading ? <Skel h={160} /> : topProds.map((p, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0", borderBottom: i < topProds.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, overflow: "hidden", background: C.border, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.image
                        ? <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 14 }}>📦</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{p.unitsSold} units sold</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.emerald }}>{fmtINR(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Driver Activity */}
            <Card>
              <SectionTitle title="Driver Activity" sub="Top by deliveries" />
              <div style={{ padding: "12px 20px 16px" }}>
                {loading ? <Skel h={140} /> : drivers.slice(0, 4).map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
                  }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
                        background: d.isOnline ? C.emeraldL : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 13,
                        color: d.isOnline ? C.emerald : C.muted,
                      }}>
                        {d.profileImage
                          ? <img src={d.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : d.fullName?.charAt(0)
                        }
                      </div>
                      <span style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 9, height: 9, borderRadius: "50%",
                        background: d.isOnline ? C.emerald : "#cbd5e1",
                        border: "1.5px solid #fff",
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.fullName}</p>
                      <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{d.vehicleType} · ★{d.rating.toFixed(1)}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.slate }}>{d.totalDelivered}</p>
                      {d.activeOrders > 0 && (
                        <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: C.blue }}>{d.activeOrders} active</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}