import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addComboToCart, toggleComboWishlist, fetchComboWishlist } from "../utils/cartWishlist";
import { openLoginModal } from "../utils/authEvents";

const API_BASE = import.meta.env.VITE_API_URL;

const HeartIcon = ({ filled }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#e53935" : "none"} stroke={filled ? "#e53935" : "#ccc"} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const CartIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const BoltIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L14 2Z" />
    </svg>
);

const ArrowRight = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const useResponsive = () => {
    const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return { isMobile: width < 600, isTablet: width >= 600 && width < 1024, isDesktop: width >= 1024 };
};

// ─── Single Combo Card ────────────────────────────────────────────────────────
const ComboCard = ({ combo, wishedIds, onWishToggle, onBuyNow, onViewDetail }) => {
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const wished = wishedIds.includes(combo.id);

    const savings = Number(combo.totalMrp) - Number(combo.comboPrice);
    const savingsPct = combo.totalMrp > 0 ? Math.round((savings / combo.totalMrp) * 100) : 0;
    const isOutOfStock = combo.stockQuantity === 0;
    const isLowStock = combo.stockQuantity > 0 && combo.stockQuantity <= 10;
    const isLoggedIn = () => !!localStorage.getItem("userToken");

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (!isLoggedIn()) { openLoginModal(); return; }
        if (loading) return;
        setLoading(true);
        try {
            await addComboToCart(combo.id, 1);
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
            window.dispatchEvent(new CustomEvent("cart:added", {
                detail: { name: combo.name, image: combo.thumbnail }
            }));
        } catch (err) {
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
            onClick={() => !isOutOfStock && onViewDetail && onViewDetail(combo)}
            style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #d0ead0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(27,110,27,0.09), 0 1px 3px rgba(0,0,0,0.05)",
                cursor: isOutOfStock ? "default" : "pointer",
                opacity: isOutOfStock ? 0.7 : 1,
                transition: "transform 0.18s, box-shadow 0.18s",
            }}
            onMouseEnter={e => {
                if (!isOutOfStock) {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(27,110,27,0.16)";
                }
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(27,110,27,0.09), 0 1px 3px rgba(0,0,0,0.05)";
            }}
        >
            {/* Animated shimmer stripe */}
            <div style={{
                height: 4, flexShrink: 0,
                background: isOutOfStock
                    ? "#ccc"
                    : "linear-gradient(90deg, #2d9e2d, #56c256, #2d9e2d)",
                backgroundSize: "200% auto",
                animation: isOutOfStock ? "none" : "comboStripe 2.5s linear infinite",
            }} />

            {/* Discount badge */}
            {savingsPct > 0 && (
                <div style={{
                    position: "absolute", top: 11, left: 8, zIndex: 2,
                    background: isOutOfStock ? "#999" : "linear-gradient(135deg, #ff6b35, #e53935)",
                    color: "#fff", fontSize: 8, fontWeight: 800,
                    padding: "3px 7px", borderRadius: 5,
                    boxShadow: isOutOfStock ? "none" : "0 2px 6px rgba(229,57,53,0.35)",
                    letterSpacing: "0.3px",
                }}>{savingsPct}% OFF</div>
            )}

            {/* Wishlist button */}
            <button
                onClick={handleWishlist}
                style={{
                    position: "absolute", top: 9, right: 8, zIndex: 2,
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid #e8e8e8", borderRadius: "50%",
                    width: 26, height: 26, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
            >
                <HeartIcon filled={wished} />
            </button>

            {/* Out of stock overlay */}
            {isOutOfStock && (
                <div style={{
                    position: "absolute", inset: 0, zIndex: 5,
                    background: "rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 14,
                }}>
                    <span style={{
                        background: "#fff", color: "#666",
                        fontSize: 10, fontWeight: 700,
                        padding: "5px 14px", borderRadius: 20,
                        border: "1px solid #ddd",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}>Out of stock</span>
                </div>
            )}

            {/* Image — square 1:1, objectFit contain so full image shows */}
            <div style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "linear-gradient(145deg, #f0faf0, #e8f5e8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
            }}>
                {combo.thumbnail ? (
                    <img
                        src={combo.thumbnail}
                        alt={combo.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                    />
                ) : (
                    <span style={{ fontSize: isMobile ? 36 : 44 }}>🎁</span>
                )}
            </div>

            {/* Card body */}
            <div style={{
                padding: isMobile ? "8px 8px 10px" : "10px 10px 12px",
                display: "flex", flexDirection: "column", flex: 1, gap: 5,
            }}>
                {/* Combo tag */}
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: 8, fontWeight: 700, color: "#1b5e20",
                    background: "#e8f5e9", border: "1px solid #c8e6c9",
                    padding: "2px 7px", borderRadius: 20, alignSelf: "flex-start",
                }}>🎁 Combo</span>

                {/* Name */}
                <p style={{
                    fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#1a2e1a",
                    lineHeight: 1.3, margin: 0,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                }}>{combo.name}</p>

                {/* Product thumbnails */}
                <div style={{
                    display: "flex", gap: 3,
                    background: "#f4faf4", borderRadius: 7,
                    padding: "4px 5px", border: "1px solid #ddeedd",
                }}>
                    {(combo.products || []).slice(0, 4).map((p, i) => (
                        <div key={p.id || i} title={p.name} style={{
                            flexShrink: 0,
                            width: isMobile ? 26 : 30,
                            height: isMobile ? 26 : 30,
                            borderRadius: 6,
                            background: "#fff", border: "1px solid #d0ead0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden", position: "relative",
                        }}>
                            {p.thumbnail
                                ? <img src={p.thumbnail} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
                                : <span style={{ fontSize: 12 }}>🛒</span>
                            }
                            {p.quantity > 1 && (
                                <span style={{
                                    position: "absolute", bottom: 0, right: 0,
                                    background: "#2d9e2d", color: "#fff",
                                    fontSize: 6, fontWeight: 800,
                                    padding: "1px 2px", borderRadius: "2px 0 0 0", lineHeight: 1,
                                }}>×{p.quantity}</span>
                            )}
                        </div>
                    ))}
                    {(combo.products || []).length > 4 && (
                        <div style={{
                            flexShrink: 0,
                            width: isMobile ? 26 : 30,
                            height: isMobile ? 26 : 30,
                            borderRadius: 6,
                            background: "#e8f5e9", border: "1px solid #c8e6c9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 8, fontWeight: 800, color: "#2d6a2d",
                        }}>+{combo.products.length - 4}</div>
                    )}
                </div>

                {/* Price row */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: "#1b5e20" }}>
                        ₹{Number(combo.comboPrice).toFixed(2)}
                    </span>
                    {combo.totalMrp > combo.comboPrice && (
                        <span style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through" }}>
                            ₹{Number(combo.totalMrp).toFixed(2)}
                        </span>
                    )}
                    {savings > 0 && (
                        <span style={{
                            fontSize: 7, fontWeight: 800, color: "#1b5e20",
                            background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
                            border: "1px solid #a5d6a7",
                            borderRadius: 4, padding: "2px 5px",
                        }}>Save ₹{savings.toFixed(2)}</span>
                    )}
                </div>

                {/* Low stock warning */}
                {isLowStock && (
                    <p style={{ fontSize: 8, color: "#bf360c", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
                        ⚠️ Only {combo.stockQuantity} left!
                    </p>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 5, marginTop: "auto", paddingTop: 3 }}>
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || loading}
                        style={{
                            flex: 1, padding: isMobile ? "6px 0" : "7px 0",
                            background: added ? "#1b5e20" : "#fff",
                            border: `1.5px solid ${isOutOfStock ? "#ccc" : added ? "#1b5e20" : "#2d9e2d"}`,
                            color: isOutOfStock ? "#aaa" : added ? "#fff" : "#1b5e20",
                            borderRadius: 8, fontSize: 9, fontWeight: 700,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                            transition: "all 0.18s",
                        }}
                    >
                        <CartIcon />
                        {isOutOfStock ? "N/A" : added ? "✓ Added!" : "Add"}
                    </button>

                    <button
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        style={{
                            flex: 1, padding: isMobile ? "6px 0" : "7px 0",
                            background: isOutOfStock ? "#eee" : "linear-gradient(135deg, #ff6b35, #e53935)",
                            border: "none",
                            color: isOutOfStock ? "#aaa" : "#fff",
                            borderRadius: 8, fontSize: 9, fontWeight: 700,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                            boxShadow: isOutOfStock ? "none" : "0 2px 6px rgba(229,57,53,0.3)",
                            transition: "opacity 0.18s",
                        }}
                    >
                        <BoltIcon /> Buy
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── ComboSection ─────────────────────────────────────────────────────────────
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
            .catch(() => { });
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

    const cols = isMobile
        ? "repeat(2, minmax(0, 1fr))"
        : isTablet
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(4, minmax(0, 1fr))";

    const maxDiscount = combos.length > 0
        ? Math.max(...combos.map(c => c.totalMrp > 0 ? Math.round(((c.totalMrp - c.comboPrice) / c.totalMrp) * 100) : 0))
        : 45;

    if (!loading && combos.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes comboStripe {
                    0%   { background-position: 0% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes comboShimmer {
                    0%   { background-position: -400px 0; }
                    100% { background-position: 400px 0; }
                }
                .combo-skeleton {
                    background: linear-gradient(90deg, #e8f5e9 25%, #f4faf4 50%, #e8f5e9 75%);
                    background-size: 800px 100%;
                    animation: comboShimmer 1.4s ease-in-out infinite;
                    border-radius: 14px;
                }
            `}</style>

            {/* ── Outer wrapper ── */}
            <section style={{
                marginTop: isMobile ? 20 : 28,
                marginBottom: isMobile ? 24 : isTablet ? 36 : 64,
                borderRadius: 22,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(27,110,27,0.18), 0 2px 8px rgba(0,0,0,0.07)",
            }}>

                {/* ── Hero header ── */}
                <div style={{
                    background: "#1a6e1a",
                    padding: isMobile ? "18px 14px 22px" : "22px 20px 26px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Decorative blobs */}
                    <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -60, right: -50, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)", bottom: -40, left: 20, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 55, height: 55, borderRadius: "50%", background: "rgba(90,200,90,0.18)", top: 14, right: 80, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.10)", top: 40, left: 80, pointerEvents: "none" }} />

                    {/* Decorative leaves */}
                    <div style={{ position: "absolute", right: 16, top: 18, fontSize: 52, opacity: 0.12, transform: "rotate(20deg)", lineHeight: 1, pointerEvents: "none" }}>🌿</div>
                    <div style={{ position: "absolute", left: 10, bottom: 10, fontSize: 36, opacity: 0.10, transform: "rotate(-15deg)", lineHeight: 1, pointerEvents: "none" }}>🍃</div>

                    {/* Chip */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.28)",
                        color: "#d4f5d4", fontSize: 9, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 20,
                        marginBottom: 10, letterSpacing: "0.5px",
                        textTransform: "uppercase",
                    }}>🎁 Special combos</div>

                    {/* Title */}
                    <h2 style={{
                        fontSize: isMobile ? 22 : 26,
                        fontWeight: 800, color: "#fff",
                        lineHeight: 1.15, margin: "0 0 4px",
                        textShadow: "0 1px 8px rgba(0,0,0,0.18)",
                    }}>Combo Deals 🎁</h2>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", margin: "0 0 14px" }}>
                        Bundle up &amp; save big on every order
                    </p>

                    {/* Pills */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                        {[
                            { icon: "🔥", label: `Up to ${maxDiscount}% off`, hot: true },
                            { icon: "⏱️", label: "Limited time" },
                            { icon: "🚚", label: "Free delivery" },
                        ].map((p, i) => (
                            <span key={i} style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                background: p.hot ? "rgba(229,57,53,0.7)" : "rgba(255,255,255,0.13)",
                                border: `1px solid ${p.hot ? "rgba(229,57,53,0.5)" : "rgba(255,255,255,0.22)"}`,
                                color: "#fff", fontSize: 9, fontWeight: 600,
                                padding: "4px 10px", borderRadius: 20,
                            }}>
                                {p.icon} {p.label}
                            </span>
                        ))}
                    </div>

                    {/* View all button */}
                    <button
                        onClick={() => onViewAll ? onViewAll() : navigate("/combos")}
                        style={{
                            background: "#fff", border: "none",
                            color: "#1a6e1a", fontSize: isMobile ? 11 : 12, fontWeight: 800,
                            padding: isMobile ? "8px 18px" : "9px 22px",
                            borderRadius: 22, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 6,
                            boxShadow: "0 3px 12px rgba(0,0,0,0.18)",
                            letterSpacing: "0.2px",
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                        View all deals <ArrowRight />
                    </button>
                </div>

                {/* ── Stats bar ── */}
                <div style={{
                    display: "flex",
                    background: "#155515",
                    padding: isMobile ? "10px 14px" : "12px 20px",
                }}>
                    {[
                        { num: `${maxDiscount}%`, label: "Max savings" },
                        { num: `${combos.length || 12}+`, label: "Active combos" },
                        { num: "₹300", label: "Avg. saving" },
                        { num: "4.8★", label: "Top rated" },
                    ].map((s, i, arr) => (
                        <div key={i} style={{
                            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                            borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.12)" : "none",
                            padding: "0 4px",
                        }}>
                            <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#7ee87e" }}>{s.num}</span>
                            <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 1, textAlign: "center" }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Cards grid ── */}
                <div style={{
                    background: "linear-gradient(180deg, #f0fdf0 0%, #f8fff8 100%)",
                    padding: isMobile ? "12px 10px 14px" : "16px 14px 18px",
                }}>
                    {loading ? (
                        <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 9 : 12 }}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="combo-skeleton" style={{ aspectRatio: "3/4" }} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 9 : 12 }}>
                            {combos.map((combo, i) => (
                                <ComboCard
                                    key={combo.id || i}
                                    combo={combo}
                                    wishedIds={wishedIds}
                                    onWishToggle={handleWishToggle}
                                    onBuyNow={handleBuyNow}
                                    onViewDetail={(c) => navigate(`/combos/${c.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer strip ── */}
                <div style={{
                    background: "#155515",
                    padding: "8px 14px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                        Scroll to explore more deals
                    </span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {[true, false, false].map((active, i) => (
                            <div key={i} style={{
                                width: active ? 14 : 5, height: 5,
                                borderRadius: active ? 3 : "50%",
                                background: active ? "#7ee87e" : "rgba(255,255,255,0.25)",
                                transition: "all 0.2s",
                            }} />
                        ))}
                    </div>
                </div>

            </section>
        </>
    );
}