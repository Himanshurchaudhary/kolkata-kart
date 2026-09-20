import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addComboToCart, toggleComboWishlist, fetchComboWishlist } from "../utils/cartWishlist";
import { openLoginModal } from "../utils/authEvents";

const API_BASE = import.meta.env.VITE_API_URL;

const HeartIcon = ({ filled }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#e74c3c" : "none"} stroke={filled ? "#e74c3c" : "#999"} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const CartIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const BoltIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L14 2Z" />
    </svg>
);

const ChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const useResponsive = () => {
    const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return { isMobile: width < 600, isTablet: width >= 600 && width < 1024, isDesktop: width >= 1024, width };
};

// ─── Single Combo Card — light green stylish background ──────────────────────
const ComboCard = ({ combo, wishedIds, onWishToggle, onBuyNow, onViewDetail }) => {
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const wished = wishedIds.includes(combo.id);

    const savings = Number(combo.totalMrp) - Number(combo.comboPrice);
    const savingsPct = combo.totalMrp > 0 ? Math.round((savings / combo.totalMrp) * 100) : 0;
    const isLoggedIn = () => !!localStorage.getItem("userToken");

    const handleAddToCart = async (e) => {
  e.stopPropagation();
  if (!isLoggedIn()) { openLoginModal(); return; }
  if (loading) return;
  setLoading(true);
  try {
    await addComboToCart(combo.id, 1);          // ← combo.id, poora combo nahi
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    window.dispatchEvent(new CustomEvent("cart:added", {
      detail: { name: combo.name, image: combo.thumbnail }
    }));
  } catch (err) {                                // ← err dikhao
    alert(err.message || "Failed to add combo to cart. Please try again.");
  } finally {
    setLoading(false);
  }
};

    const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { openLoginModal(); return; }
    try {
        await toggleComboWishlist(combo.id, wished);
        if (onWishToggle) onWishToggle(combo.id, !wished);
    } catch { alert("Failed to update wishlist."); }
};
    const handleBuyNow = (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) { openLoginModal(); return; }
        if (onBuyNow) onBuyNow(combo);
    };

    return (
        <div
            onClick={() => onViewDetail && onViewDetail(combo)}
            style={{
                background: "linear-gradient(145deg, #f0faf0 0%, #e8f5e9 60%, #f0fdf4 100%)",
                borderRadius: 14,
                border: "1.5px solid #c8e6c9",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(45,158,45,0.10), 0 1px 4px rgba(0,0,0,0.05)",
                display: "flex", flexDirection: "column",
                position: "relative", overflow: "hidden",
                transition: "box-shadow 0.22s, transform 0.22s",
                cursor: "default",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(45,158,45,0.18), 0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(45,158,45,0.10), 0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
            {/* Decorative top strip */}
            <div style={{
                height: 4, width: "100%",
                background: "linear-gradient(90deg, #2d9e2d, #66bb6a, #2d9e2d)",
                backgroundSize: "200% auto",
            }} />

            {/* Discount badge */}
            {savingsPct > 0 && (
                <div style={{
                    position: "absolute", top: 12, left: 10, zIndex: 2,
                    background: "linear-gradient(135deg,#ff6b35,#e53935)",
                    color: "#fff", fontSize: 9, fontWeight: 900,
                    padding: "3px 8px", borderRadius: 5,
                    boxShadow: "0 2px 6px rgba(229,57,53,0.35)",
                    letterSpacing: "0.3px",
                }}>{savingsPct}% OFF</div>
            )}

            {/* Wishlist */}
            <button onClick={handleWishlist} style={{
                position: "absolute", top: 10, right: 10, zIndex: 2,
                background: "rgba(255,255,255,0.85)", border: "1px solid #c8e6c9",
                borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.10)"
            }}>
                <HeartIcon filled={wished} />
            </button>

            {/* Thumbnail */}
            <div style={{
                width: "100%", height: isMobile ? 100 : 140,
                background: "rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
            }}>
                {combo.thumbnail
                    ? <img src={combo.thumbnail} alt={combo.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: isMobile ? 36 : 48 }}>🎁</span>
                }
            </div>

            {/* Card body */}
            <div style={{ padding: isMobile ? "8px 10px 10px" : "10px 12px 12px", display: "flex", flexDirection: "column", flex: 1 }}>

                {/* COMBO tag */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    background: "rgba(45,158,45,0.12)", color: "#1b5e20",
                    fontSize: 9, fontWeight: 800, padding: "2px 8px",
                    borderRadius: 20, alignSelf: "flex-start", marginBottom: 5,
                    border: "1px solid rgba(45,158,45,0.2)",
                }}>🎁 COMBO DEAL</div>

                {/* Name */}
                <div style={{
                    fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#1b3a1b",
                    marginBottom: 7, lineHeight: 1.35,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>{combo.name}</div>

                {/* Products mini strip — all 4 in one row */}
                <div style={{
                    display: "flex", gap: 4, marginBottom: 8,
                    background: "rgba(255,255,255,0.7)", borderRadius: 8,
                    padding: "5px 6px", border: "1px solid #d4edda",
                    flexWrap: "nowrap", overflowX: "auto",
                }}>
                    {(combo.products || []).slice(0, 4).map((p, i) => (
                        <div key={p.id || i} title={p.name} style={{
                            flexShrink: 0,
                            width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
                            borderRadius: 7, overflow: "hidden",
                            background: "#f1f8f1", border: "1.5px solid #c8e6c9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative",
                        }}>
                            {p.thumbnail
                                ? <img src={p.thumbnail} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: 16 }}>🛒</span>
                            }
                            {p.quantity > 1 && (
                                <span style={{
                                    position: "absolute", bottom: 0, right: 0,
                                    background: "#2d9e2d", color: "#fff",
                                    fontSize: 7, fontWeight: 900, padding: "1px 2px",
                                    borderRadius: "3px 0 0 0", lineHeight: 1,
                                }}>×{p.quantity}</span>
                            )}
                        </div>
                    ))}
                    {(combo.products || []).length > 4 && (
                        <div style={{
                            flexShrink: 0, width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
                            borderRadius: 7, background: "#e8f5e9",
                            border: "1.5px solid #c8e6c9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 800, color: "#2d9e2d"
                        }}>+{combo.products.length - 4}</div>
                    )}
                </div>

                {/* Price row */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: "#1b5e20" }}>
                        ₹{Number(combo.comboPrice).toFixed(2)}
                    </span>
                    {combo.totalMrp > combo.comboPrice && (
                        <span style={{ fontSize: 11, color: "#999", textDecoration: "line-through" }}>
                            ₹{Number(combo.totalMrp).toFixed(2)}
                        </span>
                    )}
                </div>

                {savings > 0 && (
                    <div style={{
                        fontSize: 10, fontWeight: 700, marginBottom: 8,
                        color: "#2d9e2d",
                        background: "rgba(45,158,45,0.08)",
                        borderRadius: 4, padding: "2px 6px", alignSelf: "flex-start",
                    }}>
                        🎉 Save ₹{savings.toFixed(2)}
                    </div>
                )}

                {/* Stock warnings */}
                {combo.stockQuantity === 0 && (
                    <div style={{ fontSize: 9, color: "#c62828", fontWeight: 700, marginBottom: 6 }}>❌ Out of Stock</div>
                )}
                {combo.stockQuantity > 0 && combo.stockQuantity <= 10 && (
                    <div style={{ fontSize: 9, color: "#e65100", fontWeight: 700, marginBottom: 6 }}>⚠️ Only {combo.stockQuantity} left!</div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    <button onClick={handleAddToCart} disabled={combo.stockQuantity === 0 || loading}
                        style={{
                            flex: 1, padding: isMobile ? "6px 0" : "7px 0",
                            background: combo.stockQuantity === 0 ? "#ccc" : added ? "#1b5e20" : "#2d9e2d",
                            color: "#fff", border: "none", borderRadius: 7,
                            fontSize: 10, fontWeight: 700,
                            cursor: combo.stockQuantity === 0 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            transition: "background 0.2s",
                            boxShadow: combo.stockQuantity === 0 ? "none" : "0 2px 6px rgba(45,158,45,0.3)",
                        }}>
                        <CartIcon /> {combo.stockQuantity === 0 ? "Out of Stock" : added ? "✓ Added!" : "Add to Cart"}
                    </button>
                    <button onClick={handleBuyNow} disabled={combo.stockQuantity === 0}
                        style={{
                            flex: 1, padding: isMobile ? "6px 0" : "7px 0",
                            background: combo.stockQuantity === 0 ? "#eee" : "linear-gradient(135deg,#ff6b35,#e53935)",
                            color: combo.stockQuantity === 0 ? "#aaa" : "#fff",
                            border: "none", borderRadius: 7,
                            fontSize: 10, fontWeight: 700,
                            cursor: combo.stockQuantity === 0 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            transition: "opacity 0.2s",
                            boxShadow: combo.stockQuantity === 0 ? "none" : "0 2px 6px rgba(255,107,53,0.35)",
                        }}>
                        <BoltIcon /> Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── ComboSection (Homepage) ──────────────────────────────────────────────────
export default function ComboSection({ onViewAll }) {
    const { isMobile, isTablet } = useResponsive();
    const navigate = useNavigate();

    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishedIds, setWishedIds] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/combos/allFree?limit=10`)
            .then(r => r.json())
            .then(data => {
                const all = data.combos || [];
                const sorted = all
                    .filter(c => c.status === "active")
                    .sort((a, b) => {
                        const savA = a.totalMrp > 0 ? (a.totalMrp - a.comboPrice) / a.totalMrp : 0;
                        const savB = b.totalMrp > 0 ? (b.totalMrp - b.comboPrice) / b.totalMrp : 0;
                        return savB - savA;
                    })
                    .slice(0, 4);
                setCombos(sorted);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    fetchComboWishlist()
        .then(data => setWishedIds((data.combos || []).map(c => c.id)))
        .catch(() => {});
}, []);

    const handleWishToggle = (comboId, nowWished) => {
    setWishedIds(prev =>
        nowWished ? [...new Set([...prev, comboId])] : prev.filter(id => id !== comboId)
    );
};

    const handleBuyNow = (combo) => {
        sessionStorage.setItem("buyNowCombo", JSON.stringify(combo));
        navigate("/user/checkout?type=combo");
    };

    const cols = isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)";

    if (!loading && combos.length === 0) return null;

    return (
        <>
            <style>{`
        @keyframes comboShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .combo-skeleton {
          background: linear-gradient(90deg, #e8f5e9 25%, #f0faf0 50%, #e8f5e9 75%);
          background-size: 800px 100%;
          animation: comboShimmer 1.4s ease-in-out infinite;
          border-radius: 14px;
        }
      `}</style>

            {/* ── Outer wrapper: light green section bg with top margin gap ── */}
            <section style={{
                marginTop: isMobile ? 20 : 28,          /* gap from flash sale */
                marginBottom: isMobile ? 24 : isTablet ? 36 : 64,
                background: "linear-gradient(180deg, #f0faf0 0%, #fafffe 100%)",
                borderRadius: 18,
                border: "1.5px solid #c8e6c9",
                padding: isMobile ? "14px 12px 16px" : "20px 20px 22px",
                boxShadow: "0 2px 16px rgba(45,158,45,0.07)",
            }}>

                {/* Section Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 12 : 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: isMobile ? 20 : 24 }}>🎁</span>
                        <h2 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: "#1b3a1b", margin: 0 }}>
                            Combo Deals
                        </h2>
                        <span style={{
                            background: "linear-gradient(135deg,#ff6b35,#e53935)",
                            color: "#fff", fontSize: 9, fontWeight: 900,
                            padding: "2px 9px", borderRadius: 20,
                            boxShadow: "0 2px 6px rgba(229,57,53,0.3)",
                            letterSpacing: "0.3px",
                        }}>TOP SAVINGS</span>
                    </div>

                    <button
                        onClick={() => onViewAll ? onViewAll() : navigate("/combos")}
                        style={{
                            display: "flex", alignItems: "center", gap: 3,
                            background: "#2d9e2d", border: "none",
                            color: "#fff", borderRadius: 20, padding: isMobile ? "5px 12px" : "6px 16px",
                            fontSize: isMobile ? 11 : 12, fontWeight: 700, cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(45,158,45,0.3)",
                            transition: "opacity 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                        View All <ChevronRight />
                    </button>
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 8 : 12 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="combo-skeleton" style={{ height: isMobile ? 260 : 320 }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 8 : 12 }}>
                        {combos.map((combo, i) => (
                            <ComboCard
                                key={combo.id || i}
                                combo={combo}
                                wishedIds={wishedIds}
                                onWishToggle={handleWishToggle}
                                onBuyNow={handleBuyNow}
                                onViewDetail={(combo) => navigate(`/combos/${combo.id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}