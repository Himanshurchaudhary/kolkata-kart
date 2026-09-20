import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addComboToCart, toggleComboWishlist, fetchComboWishlist } from "../utils/cartWishlist";
import { openLoginModal } from "../utils/authEvents";

const API_BASE = import.meta.env.VITE_API_URL;

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#e74c3c" : "none"} stroke={filled ? "#e74c3c" : "#bbb"} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const CartIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const BoltIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L14 2Z" />
    </svg>
);

const BackIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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

// ─── Combo Detail Modal ───────────────────────────────────────────────────────
const ComboDetailModal = ({ combo, wishedIds, onClose, onCartAdded, onBuyNow, onWishToggle }) => {
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const wished = combo && (combo.products || []).some(p => wishedIds.includes(p.id));

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    if (!combo) return null;

    const savings = combo.totalMrp - combo.comboPrice;
    const savingsPct = combo.totalMrp > 0 ? Math.round((savings / combo.totalMrp) * 100) : 0;
    const isLoggedIn = () => !!localStorage.getItem("userToken");

    const handleAddToCart = async () => {
        if (!isLoggedIn()) { openLoginModal(); return; }
        if (loading) return;
        setLoading(true);
        try {
            for (const p of (combo.products || [])) {
                for (let q = 0; q < (p.quantity || 1); q++) {
                    await addToCart(p.id);
                }
            }
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
            window.dispatchEvent(new CustomEvent("cart:added", {
                detail: { name: combo.name, image: combo.thumbnail }
            }));
            if (onCartAdded) onCartAdded(combo);
        } catch {
            alert("Failed to add to cart.");
        } finally {
            setLoading(false);
        }
    };

    const handleWish = async () => {
        if (!isLoggedIn()) { openLoginModal(); return; }
        try {
            for (const p of (combo.products || [])) {
                await toggleWishlist(p.id, wished);
            }
            if (onWishToggle) onWishToggle(combo.id, !wished);
        } catch {
            alert("Failed to update wishlist.");
        }
    };

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            zIndex: 9000, display: "flex", alignItems: "flex-end",
            justifyContent: "center", padding: isMobile ? 0 : 20
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 16,
                width: "100%", maxWidth: 560,
                maxHeight: isMobile ? "90vh" : "85vh",
                overflowY: "auto", padding: isMobile ? "20px 16px 28px" : 28,
                position: "relative"
            }}>
                {/* Close */}
                <button onClick={onClose} style={{
                    position: "absolute", top: 14, right: 14,
                    background: "#f5f5f5", border: "none", borderRadius: "50%",
                    width: 32, height: 32, cursor: "pointer", fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>

                {/* Image */}
                <div style={{
                    width: "100%", height: 200, background: "#f8f8f8",
                    borderRadius: 12, overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16
                }}>
                    {combo.thumbnail
                        ? <img src={combo.thumbnail} alt={combo.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 64 }}>🎁</span>
                    }
                </div>

                {/* Badges */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <span style={{
                        background: "#fff3e0", color: "#e65100",
                        fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20
                    }}>🎁 COMBO DEAL</span>
                    {savingsPct > 0 && (
                        <span style={{
                            background: "linear-gradient(135deg,#ff6b35,#e74c3c)",
                            color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20
                        }}>{savingsPct}% OFF</span>
                    )}
                    {combo.discountLabel && (
                        <span style={{
                            background: "#e8f5e9", color: "#2d9e2d",
                            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20
                        }}>{combo.discountLabel}</span>
                    )}
                </div>

                {/* Name */}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", margin: "0 0 6px" }}>{combo.name}</h2>

                {/* Description */}
                {combo.description && (
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: "0 0 14px" }}>{combo.description}</p>
                )}

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: "#2d9e2d" }}>₹{Number(combo.comboPrice).toFixed(2)}</span>
                    {combo.totalMrp > combo.comboPrice && (
                        <span style={{ fontSize: 15, color: "#bbb", textDecoration: "line-through" }}>₹{Number(combo.totalMrp).toFixed(2)}</span>
                    )}
                </div>
                {savings > 0 && (
                    <div style={{ fontSize: 13, color: "#2d9e2d", fontWeight: 700, marginBottom: 16 }}>
                        🎉 You save ₹{savings.toFixed(2)}!
                    </div>
                )}

                {/* Products in combo */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>
                        Includes {combo.products?.length || 0} Products:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(combo.products || []).map((p, i) => (
                            <div key={p.id || i} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 10px", background: "#f9f9f9",
                                borderRadius: 8, border: "1px solid #eee"
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 6, overflow: "hidden",
                                    background: "#eee", flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    {p.thumbnail
                                        ? <img src={p.thumbnail} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : <span style={{ fontSize: 22 }}>🛒</span>
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>{p.name}</div>
                                    <div style={{ fontSize: 11, color: "#888" }}>{p.unit || ""} • Qty: {p.quantity || 1}</div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#2d9e2d" }}>₹{Number(p.sellingPrice || p.discountPrice || 0).toFixed(2)}</div>
                                    {p.buyingPrice && <div style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through" }}>₹{Number(p.buyingPrice).toFixed(2)}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock */}
                {combo.stockQuantity === 0 ? (
                    <div style={{ textAlign: "center", padding: "10px", background: "#fee", borderRadius: 8, color: "#e74c3c", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
                        ❌ Out of Stock
                    </div>
                ) : combo.stockQuantity <= 10 ? (
                    <div style={{ textAlign: "center", padding: "6px", color: "#e67e22", fontWeight: 600, fontSize: 12, marginBottom: 10 }}>
                        ⚠️ Only {combo.stockQuantity} left!
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleWish} style={{
                        width: 44, height: 44, borderRadius: 8, border: "1px solid #eee",
                        background: wished ? "#fff0f0" : "#f5f5f5", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                        <HeartIcon filled={wished} />
                    </button>
                    <button onClick={handleAddToCart} disabled={combo.stockQuantity === 0 || loading}
                        style={{
                            flex: 1, padding: "12px",
                            background: combo.stockQuantity === 0 ? "#ccc" : added ? "#218c21" : "#2d9e2d",
                            color: "#fff", border: "none", borderRadius: 8,
                            fontSize: 13, fontWeight: 700, cursor: combo.stockQuantity === 0 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "background 0.2s"
                        }}>
                        <CartIcon /> {combo.stockQuantity === 0 ? "Out of Stock" : added ? "✓ Added!" : "Add to Cart"}
                    </button>
                    <button onClick={() => { onClose(); onBuyNow(combo); }}
                        disabled={combo.stockQuantity === 0}
                        style={{
                            flex: 1, padding: "12px",
                            background: combo.stockQuantity === 0 ? "#eee" : "#ff6b35",
                            color: combo.stockQuantity === 0 ? "#aaa" : "#fff",
                            border: "none", borderRadius: 8,
                            fontSize: 13, fontWeight: 700, cursor: combo.stockQuantity === 0 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "background 0.2s"
                        }}>
                        <BoltIcon /> Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Combo Card (Full Page) ───────────────────────────────────────────────────
const ComboCard = ({ combo, wishedIds, onWishToggle, onBuyNow, onViewDetail }) => {
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const wished = wishedIds.includes(combo.id);

    const savings = combo.totalMrp - combo.comboPrice;
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
    } catch {
        alert("Failed to update wishlist.");
    }
};

    return (
        <div
            onClick={() => onViewDetail(combo)}
            style={{
                background: "#fff", borderRadius: 12, padding: isMobile ? "10px" : "14px",
                border: "1px solid #efefef", boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                display: "flex", flexDirection: "column", position: "relative",
                cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
            {savingsPct > 0 && (
                <div style={{
                    position: "absolute", top: 10, left: 10, zIndex: 2,
                    background: "linear-gradient(135deg,#ff6b35,#e74c3c)",
                    color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 4
                }}>{savingsPct}% OFF</div>
            )}

            <button onClick={handleWishlist} style={{
                position: "absolute", top: 10, right: 10, zIndex: 2,
                background: "#fff", border: "none", borderRadius: "50%",
                width: 28, height: 28, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.13)"
            }}>
                <HeartIcon filled={wished} />
            </button>

            {/* Image */}
            <div style={{
                width: "100%", height: isMobile ? 110 : 160, background: "#f8f8f8",
                borderRadius: 8, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10
            }}>
                {combo.thumbnail
                    ? <img src={combo.thumbnail} alt={combo.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 48 }}>🎁</span>
                }
            </div>

            <div style={{
                display: "inline-flex", alignItems: "center",
                background: "#fff3e0", color: "#e65100",
                fontSize: 9, fontWeight: 800, padding: "2px 8px",
                borderRadius: 20, alignSelf: "flex-start", marginBottom: 6
            }}>🎁 COMBO • {combo.products?.length || 0} Items</div>

            <div style={{
                fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#1a1a1a",
                marginBottom: 6, lineHeight: 1.35,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
            }}>{combo.name}</div>

            {/* Mini thumbs */}
            <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                {(combo.products || []).slice(0, 4).map((p, i) => (
                    <div key={i} style={{
                        width: 30, height: 30, borderRadius: 5, overflow: "hidden",
                        background: "#f5f5f5", border: "1px solid #eee",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        {p.thumbnail
                            ? <img src={p.thumbnail} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: 14 }}>🛒</span>
                        }
                    </div>
                ))}
                {(combo.products || []).length > 4 && (
                    <div style={{
                        width: 30, height: 30, borderRadius: 5, background: "#f0f0f0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, color: "#666"
                    }}>+{combo.products.length - 4}</div>
                )}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "#2d9e2d" }}>
                    ₹{Number(combo.comboPrice).toFixed(2)}
                </span>
                {combo.totalMrp > combo.comboPrice && (
                    <span style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>
                        ₹{Number(combo.totalMrp).toFixed(2)}
                    </span>
                )}
            </div>
            {savings > 0 && (
                <div style={{ fontSize: 10, color: "#2d9e2d", fontWeight: 600, marginBottom: 8 }}>
                    Save ₹{savings.toFixed(2)}
                </div>
            )}

            {combo.stockQuantity === 0 && (
                <div style={{ fontSize: 9, color: "#e74c3c", fontWeight: 600, marginBottom: 6 }}>❌ Out of Stock</div>
            )}
            {combo.stockQuantity > 0 && combo.stockQuantity <= 10 && (
                <div style={{ fontSize: 9, color: "#e67e22", fontWeight: 600, marginBottom: 6 }}>⚠️ Only {combo.stockQuantity} left!</div>
            )}

            <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                <button
                    onClick={handleAddToCart}
                    disabled={combo.stockQuantity === 0 || loading}
                    style={{
                        flex: 1, padding: "7px 0",
                        background: combo.stockQuantity === 0 ? "#ccc" : added ? "#218c21" : "#2d9e2d",
                        color: "#fff", border: "none", borderRadius: 6,
                        fontSize: 10, fontWeight: 700, cursor: combo.stockQuantity === 0 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "background 0.2s"
                    }}>
                    <CartIcon /> {combo.stockQuantity === 0 ? "Out of Stock" : added ? "✓ Added!" : "Add to Cart"}
                </button>
                <button
                    onClick={e => { e.stopPropagation(); if (combo.stockQuantity > 0) onBuyNow(combo); }}
                    disabled={combo.stockQuantity === 0}
                    style={{
                        flex: 1, padding: "7px 0",
                        background: combo.stockQuantity === 0 ? "#eee" : "#ff6b35",
                        color: combo.stockQuantity === 0 ? "#aaa" : "#fff",
                        border: "none", borderRadius: 6,
                        fontSize: 10, fontWeight: 700,
                        cursor: combo.stockQuantity === 0 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "background 0.2s"
                    }}>
                    <BoltIcon /> Buy Now
                </button>
            </div>
        </div>
    );
};

// ─── ComboPage (Full Page) ────────────────────────────────────────────────────
export default function ComboPage({ onBack }) {
    const { isMobile, isTablet } = useResponsive();
    const navigate = useNavigate();

    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishedIds, setWishedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("savings"); // savings | price_low | price_high | newest
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 12;

    const fetchCombos = async (pg = 1) => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({ page: pg, limit, ...(search ? { search } : {}) });
            const res = await fetch(`${API_BASE}/api/combos/allFree?${qs}`);
            const data = await res.json();
            let all = (data.combos || []).filter(c => c.status === "active");

            // Client-side sort
            if (sort === "savings") {
                all = all.sort((a, b) => {
                    const sA = a.totalMrp > 0 ? (a.totalMrp - a.comboPrice) / a.totalMrp : 0;
                    const sB = b.totalMrp > 0 ? (b.totalMrp - b.comboPrice) / b.totalMrp : 0;
                    return sB - sA;
                });
            } else if (sort === "price_low") {
                all = all.sort((a, b) => a.comboPrice - b.comboPrice);
            } else if (sort === "price_high") {
                all = all.sort((a, b) => b.comboPrice - a.comboPrice);
            }

            setCombos(all);
            setTotalPages(data.totalPages || 1);
        } catch {
            setCombos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCombos(page); }, [page, sort]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCombos(1);
    };

    // Wishlist
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

    const cols = isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)";

    return (
        <>
            <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        body { font-family: 'Nunito', sans-serif; }
      `}</style>

            {/* Detail Modal */}


            <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "10px 10px 0" : "16px 20px 0" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <button onClick={onBack || (() => navigate(-1))}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 36, height: 36, borderRadius: 8,
                            border: "1px solid #ddd", background: "#fff", cursor: "pointer"
                        }}>
                        <BackIcon />
                    </button>
                    <div>
                        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
                            🎁 Combo Deals
                        </h1>
                        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Bundle & save more on your favourites</p>
                    </div>
                </div>

                {/* Search + Sort Bar */}
                <div style={{
                    display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap"
                }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, position: "relative" }}>
                        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                            <SearchIcon />
                        </div>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search combo deals..."
                            style={{
                                width: "100%", padding: "9px 12px 9px 32px",
                                border: "1px solid #ddd", borderRadius: 8,
                                fontSize: 13, outline: "none", background: "#fff",
                                boxSizing: "border-box"
                            }}
                        />
                    </form>

                    <select
                        value={sort}
                        onChange={e => { setSort(e.target.value); setPage(1); }}
                        style={{
                            padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8,
                            fontSize: 13, background: "#fff", cursor: "pointer", outline: "none",
                            minWidth: 160
                        }}>
                        <option value="savings">Best Savings</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>

                {/* Stats Row */}
                {!loading && combos.length > 0 && (
                    <div style={{ marginBottom: 16, fontSize: 13, color: "#888" }}>
                        Showing <strong style={{ color: "#1a1a1a" }}>{combos.length}</strong> combo deals
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12 }}>
                        {[...Array(isMobile ? 4 : 8)].map((_, i) => (
                            <div key={i} style={{ height: isMobile ? 280 : 360, borderRadius: 12, background: "#f0f0f0", animation: "pulse 1.4s ease-in-out infinite" }} />
                        ))}
                    </div>
                ) : combos.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>No Combo Deals Found</div>
                        <div style={{ fontSize: 13, color: "#999" }}>
                            {search ? `No combos matching "${search}"` : "Check back soon for exciting bundle offers!"}
                        </div>
                        {search && (
                            <button onClick={() => { setSearch(""); fetchCombos(1); }}
                                style={{
                                    marginTop: 16, padding: "8px 24px", background: "#2d9e2d",
                                    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700
                                }}>Clear Search</button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12 }}>
                        {combos.map((combo, i) => (
                            <ComboCard
                                key={combo.id || i}
                                combo={combo}
                                wishedIds={wishedIds}
                                onWishToggle={handleWishToggle}
                                onBuyNow={handleBuyNow}
                                onViewDetail={(combo) => navigate(`/combos/${combo.id}`)}   // ✅ yeh
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "28px 0" }}>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => setPage(i + 1)}
                                style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    border: `1px solid ${page === i + 1 ? "#2d9e2d" : "#ddd"}`,
                                    background: page === i + 1 ? "#2d9e2d" : "#fff",
                                    color: page === i + 1 ? "#fff" : "#555",
                                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
                                }}>{i + 1}</button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}