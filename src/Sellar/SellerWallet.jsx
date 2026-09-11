// src/Seller/SellerWallet.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Wallet, RefreshCw, TrendingUp, TrendingDown,
  IndianRupee, AlertCircle, ChevronRight,
  ArrowDownCircle, Clock,
} from "lucide-react";

const API   = import.meta.env.VITE_API_URL;
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

const toINR = (v) =>
  Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

// ── Transaction row ────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const isCredit = tx.type === "credit";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "14px 16px",
      borderBottom: "1px solid #f3f4f6",
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: isCredit ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${isCredit ? "#bbf7d0" : "#fca5a5"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isCredit
          ? <ArrowDownCircle size={18} color="#16a34a" />
          : <TrendingDown     size={18} color="#dc2626" />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>
          {tx.order_number}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
          {fmtDate(tx.created_at)}
        </div>

        {/* Commission breakdown pill */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: "#f3f4f6", color: "#6b7280",
            padding: "2px 8px", borderRadius: 99,
          }}>
            Order ₹{toINR(tx.order_total)}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: "#fef2f2", color: "#dc2626",
            padding: "2px 8px", borderRadius: 99,
          }}>
            −{tx.commission_pct}% = ₹{toINR(tx.commission_amt)}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 800,
          color: isCredit ? "#16a34a" : "#dc2626",
        }}>
          {isCredit ? "+" : "−"}₹{toINR(tx.credited_amt)}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: isCredit ? "#16a34a" : "#dc2626",
          marginTop: 2, opacity: 0.7,
        }}>
          {isCredit ? "Credited" : "Debited"}
        </div>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, border, icon: Icon }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: "50%",
        background: "#fff", border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color, fontWeight: 700, opacity: 0.75, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>
          ₹{toINR(value)}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color, opacity: 0.6, marginTop: 3 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function SellerWallet() {
  const [wallet,       setWallet]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState("");
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [commPct,      setCommPct]      = useState(10);

  const fetchWallet = useCallback(async (isRefresh = false, pg = 1) => {
    if (pg === 1) {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError("");

    try {
      const res  = await authFetch(`/api/seller/wallet?page=${pg}&limit=20`);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to load wallet");
        return;
      }

      setWallet(data.wallet);
      setCommPct(data.commissionPercent || 10);
      setPages(data.pages || 1);

      if (pg === 1) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions(prev => [...prev, ...(data.transactions || [])]);
      }
      setPage(pg);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 12,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: 26, height: 26,
        border: "3px solid #e5e7eb", borderTopColor: "#16a34a",
        borderRadius: "50%", animation: "spin .7s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 13, color: "#9ca3af" }}>Loading wallet…</span>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && !wallet) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 12, padding: "24px 16px", textAlign: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <AlertCircle size={36} color="#dc2626" />
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{error}</div>
      <button
        onClick={() => fetchWallet()}
        style={{
          background: "#16a34a", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 20px",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky", top: 0, zIndex: 50,
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>
            My Wallet
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
            {commPct}% platform commission on each order
          </p>
        </div>
        <button
          onClick={() => fetchWallet(true, 1)}
          disabled={refreshing}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <RefreshCw
            size={15} color="#16a34a"
            style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }}
          />
        </button>
      </div>

      <div style={{ padding: "16px 16px 48px", animation: "fadeIn .3s ease" }}>

        {/* ── Balance Hero Card ─────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%)",
          borderRadius: 20, padding: "24px 20px 20px",
          marginBottom: 16, position: "relative", overflow: "hidden",
        }}>
          {/* decorative circle */}
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 130, height: 130, borderRadius: "50%",
            background: "rgba(255,255,255,.07)",
          }} />
          <div style={{
            position: "absolute", bottom: -20, right: 40,
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,.05)",
          }} />

          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.7)", marginBottom: 6 }}>
            Available Balance
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
            ₹{toINR(wallet?.balance)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginBottom: 18 }}>
            After {commPct}% commission deduction
          </div>

          {/* mini stats row inside hero */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}>
            {[
              { label: "Total Earned",     value: wallet?.total_earned,     light: true },
              { label: "Total Commission", value: wallet?.total_commission, light: false },
            ].map(({ label, value, light }) => (
              <div key={label} style={{
                background: light ? "rgba(255,255,255,.15)" : "rgba(220,38,38,.25)",
                borderRadius: 12, padding: "10px 12px",
                border: `1px solid ${light ? "rgba(255,255,255,.2)" : "rgba(220,38,38,.3)"}`,
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 600, marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                  ₹{toINR(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How commission works ──────────────────────────────────────────── */}
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 14, padding: "12px 14px", marginBottom: 16,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#92400e", marginBottom: 3 }}>
              How it works
            </div>
            <div style={{ fontSize: 11, color: "#92400e", lineHeight: 1.7 }}>
              When an order is marked <strong>Delivered</strong> or <strong>Completed</strong>,{" "}
              <strong>{commPct}%</strong> platform commission is deducted and the remaining amount
              is credited to your wallet automatically.
            </div>
            <div style={{
              marginTop: 8, fontSize: 11, fontWeight: 700,
              color: "#92400e", background: "rgba(255,255,255,.6)",
              borderRadius: 8, padding: "6px 10px",
              display: "inline-block",
            }}>
              Example: Order ₹1,000 → Commission ₹{commPct * 10} → You get ₹{1000 - commPct * 10}
            </div>
          </div>
        </div>

        {/* ── Transaction History ───────────────────────────────────────────── */}
        <div style={{
          background: "#fff",
          borderRadius: 16, border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
        }}>
          {/* Section header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: "#fafafa",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>
              Transaction History
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: "#f0fdf4", color: "#16a34a",
              border: "1px solid #bbf7d0",
              padding: "3px 10px", borderRadius: 99,
            }}>
              {transactions.length} records
            </span>
          </div>

          {/* Transactions */}
          {transactions.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "48px 24px", gap: 10, textAlign: "center",
            }}>
              <Wallet size={40} color="#e5e7eb" />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6b7280" }}>
                No transactions yet
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", maxWidth: 240, lineHeight: 1.6 }}>
                Your wallet will be credited when your first order is delivered.
              </div>
            </div>
          ) : (
            <>
              {transactions.map((tx, i) => (
                <TxRow key={tx.id || i} tx={tx} />
              ))}

              {/* Load more */}
              {page < pages && (
                <div style={{ padding: "14px 16px", textAlign: "center" }}>
                  <button
                    onClick={() => fetchWallet(false, page + 1)}
                    disabled={loadingMore}
                    style={{
                      background: loadingMore ? "#f3f4f6" : "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: loadingMore ? "#9ca3af" : "#16a34a",
                      borderRadius: 10, padding: "10px 24px",
                      fontSize: 13, fontWeight: 700, cursor: loadingMore ? "not-allowed" : "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {loadingMore ? (
                      <>
                        <div style={{
                          width: 13, height: 13,
                          border: "2px solid #d1d5db", borderTopColor: "#16a34a",
                          borderRadius: "50%", animation: "spin .7s linear infinite",
                        }} />
                        Loading…
                      </>
                    ) : "Load more"}
                  </button>
                </div>
              )}

              {page >= pages && transactions.length > 0 && (
                <div style={{
                  padding: "12px 16px", textAlign: "center",
                  fontSize: 11, color: "#d1d5db", fontWeight: 600,
                }}>
                  — All transactions shown —
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}