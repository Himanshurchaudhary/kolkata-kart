// src/Pages/ComboDetails.jsx
// Combo Detail Page — id-based routing: /combos/:id
// Same functionality as ProductDetails — cart, wishlist, buy now, lightbox, toast

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Heart, ShoppingCart, ArrowLeft, Share2,
    Package, Minus, Plus,
    CheckCircle, Loader2, ChevronRight,
    ZoomIn, X, Gift, Tag
} from "lucide-react";
import { addComboToCart, toggleComboWishlist, fetchComboWishlist } from "../utils/cartWishlist";
import { openLoginModal } from "../utils/authEvents";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("userToken");
const isLoggedIn = () => !!getToken();

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, activeIdx, onClose }) {
    const [idx, setIdx] = useState(activeIdx);
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
            if (e.key === "ArrowLeft") setIdx(i => (i - 1 + images.length) % images.length);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [images.length, onClose]);

    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
            <button onClick={onClose} style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                width: 40, height: 40, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "#fff",
            }}><X size={20} /></button>

            {images.length > 1 && <>
                <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
                    style={{
                        position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                        width: 44, height: 44, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 22,
                    }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
                    style={{
                        position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                        width: 44, height: 44, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 22,
                    }}>›</button>
            </>}

            <img src={images[idx]} alt="Combo"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: "85vh", maxWidth: "85vw", objectFit: "contain", borderRadius: 12 }} />

            {images.length > 1 && (
                <div style={{
                    position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                    display: "flex", gap: 6
                }}>
                    {images.map((_, i) => (
                        <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                            style={{
                                width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
                                background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                                border: "none", cursor: "pointer", padding: 0, transition: "width 0.25s",
                            }} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 2500);
        return () => clearTimeout(t);
    }, [onDone]);
    const colors = { success: "#166534", error: "#991b1b", info: "#1e40af" };
    return (
        <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
            background: colors[type] || colors.info, color: "#fff",
            padding: "12px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
            maxWidth: "calc(100vw - 32px)", animation: "cdToastIn 0.25s ease",
        }}>
            {type === "success" && <CheckCircle size={15} />}
            {message}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ isMobile }) => (
    <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 28, padding: isMobile ? "16px 14px" : "28px 24px",
        animation: "cdPulse 1.4s ease-in-out infinite",
    }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ height: isMobile ? 260 : 420, background: "#f0f0f0", borderRadius: 16 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[40, 20, 28, 16, 100, 60, 80].map((h, i) => (
                <div key={i} style={{
                    height: h, background: "#f0f0f0", borderRadius: 8,
                    width: i === 0 ? "70%" : i === 1 ? "40%" : "100%",
                }} />
            ))}
        </div>
    </div>
);

// ─── Product Item Row ─────────────────────────────────────────────────────────
const ProductRow = ({ p, isMobile }) => {
    const navigate = useNavigate();
    const price = Number(p.sellingPrice ?? p.discountPrice ?? 0);
    const mrp = Number(p.buyingPrice ?? 0);

    return (
        <div
            onClick={() => p.slug && navigate(`/products/${p.slug}`)}
            style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", background: "#f9fafb",
                borderRadius: 10, border: "1px solid #e8f5e9",
                cursor: p.slug ? "pointer" : "default",
                transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (p.slug) e.currentTarget.style.background = "#f0fdf4"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; }}
        >
            {/* Thumbnail */}
            <div style={{
                width: isMobile ? 46 : 56, height: isMobile ? 46 : 56,
                borderRadius: 8, overflow: "hidden", background: "#e8f5e9",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #c8e6c9",
            }}>
                {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ShoppingCart size={20} color="#2d9e2d" />
                }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#1a2332",
                    marginBottom: 2, overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
                }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {p.unit && (
                        <span style={{
                            fontSize: 10, color: "#6b7280", background: "#f3f4f6",
                            padding: "1px 6px", borderRadius: 4
                        }}>{p.unit}</span>
                    )}
                    {p.category_name && (
                        <span style={{ fontSize: 10, color: "#2d9e2d", fontWeight: 600 }}>{p.category_name}</span>
                    )}
                </div>
            </div>

            {/* Qty + Price */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                    Qty: <strong style={{ color: "#1a2332" }}>×{p.quantity || 1}</strong>
                </div>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: "#16a34a" }}>
                    ₹{price.toFixed(2)}
                </div>
                {mrp > 0 && mrp > price && (
                    <div style={{ fontSize: 10, color: "#9ca3af", textDecoration: "line-through" }}>
                        ₹{mrp.toFixed(2)}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ComboDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [combo, setCombo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [qty, setQty] = useState(1);
    const [wished, setWished] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);
    const [wishLoading, setWishLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, []);

    // ── Load combo ────────────────────────────────────────────────────────────
    const loadCombo = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/combos/free/${id}`);
            const data = await res.json();
            if (!data.success || !data.combo) {
                setError("Combo not found.");
            } else {
                setCombo(data.combo);
            }
        } catch {
            setError("Failed to load combo. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadCombo(); }, [loadCombo]);

    // ── Check wishlist (product IDs ke against) ───────────────────────────────
    useEffect(() => {
    if (!combo || !isLoggedIn()) return;
    fetchComboWishlist()
        .then(data => {
            const ids = (data.combos || []).map(c => c.id);
            setWished(ids.includes(Number(combo.id)));
        })
        .catch(() => {});
}, [combo]);

    const showToast = (message, type = "success") => setToast({ message, type });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAddToCart = async () => {
    if (!isLoggedIn()) { openLoginModal(); return; }
    if (cartLoading || isOOS) return;
    setCartLoading(true);
    try {
        await addComboToCart(combo.id, qty);
        showToast(`Added to cart (${qty} combo${qty > 1 ? "s" : ""})`, "success");
        window.dispatchEvent(new CustomEvent("cart:added", {
            detail: { name: combo.name, image: combo.thumbnail }
        }));
    } catch (err) {
        showToast(err.message || "Failed to add combo to cart", "error");
    } finally {
        setCartLoading(false);
    }
};

    const handleBuyNow = () => {
        if (!isLoggedIn()) { openLoginModal(); return; }
        if (isOOS) return;
        sessionStorage.setItem("buyNowCombo", JSON.stringify({ ...combo, qty }));
        navigate("/user/checkout?type=combo");
    };

    const handleWishlist = async () => {
    if (!isLoggedIn()) { openLoginModal(); return; }
    if (wishLoading) return;
    setWishLoading(true);
    try {
        await toggleComboWishlist(combo.id, wished);
        setWished(w => !w);
        showToast(wished ? "Removed from wishlist" : "Added to wishlist!", "success");
    } catch {
        showToast("Failed to update wishlist", "error");
    } finally {
        setWishLoading(false);
    }
};

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: combo.name, url: window.location.href }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => showToast("Link copied!", "info"))
                .catch(() => { });
        }
    };

    // ── Loading / Error states ─────────────────────────────────────────────────
    if (loading) return (
        <div style={{
            minHeight: "100vh", background: "#f4f6f4",
            fontFamily: "'Nunito','Segoe UI',sans-serif"
        }}>
            <style>{`@keyframes cdPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <Skeleton isMobile={isMobile} />
            </div>
        </div>
    );

    if (error || !combo) return (
        <div style={{
            minHeight: "100vh", background: "#f4f6f4",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 16,
            fontFamily: "'Nunito','Segoe UI',sans-serif", padding: 24,
        }}>
            <Gift size={56} color="#d1d5db" strokeWidth={1.2} />
            <p style={{ fontSize: 16, color: "#6b7280", fontWeight: 600, margin: 0 }}>
                {error || "Combo not found."}
            </p>
            <button onClick={() => navigate(-1)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 24px",
                background: "#16a34a", color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}><ArrowLeft size={15} /> Go Back</button>
        </div>
    );

    // ── Derived values ─────────────────────────────────────────────────────────
    const comboPrice = Number(combo.comboPrice ?? 0);
    const totalMrp = Number(combo.totalMrp ?? 0);
    const savings = totalMrp > comboPrice ? totalMrp - comboPrice : 0;
    const savingsPct = totalMrp > 0 ? Math.round((savings / totalMrp) * 100) : 0;
    const stock = Number(combo.stockQuantity ?? 0);
    const isOOS = stock === 0;
    const isLow = !isOOS && stock <= 10;

    // Combo thumbnail as primary image (single image for now)
    const allImages = [combo.thumbnail].filter(Boolean);

    const card = {
        background: "#fff", borderRadius: 16,
        boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
        padding: isMobile ? "16px 14px" : "22px 24px",
        marginBottom: 14,
    };

    return (
        <div style={{
            minHeight: "100vh", background: "#f4f6f4",
            fontFamily: "'Nunito','Segoe UI',sans-serif"
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes cdFadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cdPulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes cdToastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin      { to { transform: rotate(360deg); } }
        .cd-thumb {
          cursor: pointer; border-radius: 10px; overflow: hidden;
          border: 2px solid transparent; transition: border-color 0.15s;
          aspect-ratio: 1/1; background: #f9fafb; flex-shrink: 0;
        }
        .cd-thumb.active { border-color: #16a34a; }
        .cd-btn-cart {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 0; border-radius: 12px; font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
          border: 2px solid #16a34a; background: #fff; color: #16a34a; min-height: 50px;
        }
        .cd-btn-cart:hover:not(:disabled) { background: #16a34a; color: #fff; }
        .cd-btn-cart:disabled { opacity: 0.6; cursor: not-allowed; }
        .cd-btn-buy {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 0; border-radius: 12px; font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
          border: none; background: linear-gradient(135deg, #ff6b35, #e53935);
          color: #fff; box-shadow: 0 4px 16px rgba(229,57,53,0.3); min-height: 50px;
        }
        .cd-btn-buy:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .cd-btn-buy:disabled { opacity: 0.5; cursor: not-allowed; transform: none; background: #ccc; box-shadow: none; }
      `}</style>

            {/* ── Breadcrumb ── */}
            <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{
                    maxWidth: 1100, margin: "0 auto",
                    padding: isMobile ? "10px 14px" : "10px 24px",
                    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                }}>
                    <button onClick={() => navigate(-1)} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        color: "#16a34a", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                        padding: "6px 0",
                    }}>
                        <ArrowLeft size={14} /> Back
                    </button>
                    <ChevronRight size={12} color="#d1d5db" />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>Combo Deals</span>
                    <ChevronRight size={12} color="#d1d5db" />
                    <span style={{
                        fontSize: 12, color: "#374151", fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: isMobile ? 140 : 300,
                    }}>{combo.name}</span>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div style={{
                maxWidth: 1100, margin: "0 auto",
                padding: isMobile ? "16px 12px 40px" : "24px 24px 48px",
                animation: "cdFadeUp 0.3s ease",
            }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "480px 1fr",
                    gap: isMobile ? 16 : 24,
                    alignItems: "start",
                }}>

                    {/* ══ LEFT — Image ══ */}
                    <div>
                        <div style={{
                            ...card, padding: 12, marginBottom: 10,
                            position: "relative", overflow: "hidden",
                            cursor: allImages.length > 0 ? "zoom-in" : "default",
                        }} onClick={() => allImages.length > 0 && setLightboxIdx(0)}>
                            <div style={{
                                width: "100%", aspectRatio: "1 / 1",
                                background: "linear-gradient(145deg, #f0faf0, #e8f5e9)",
                                borderRadius: 10, overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {combo.thumbnail
                                    ? <img src={combo.thumbnail} alt={combo.name}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <Gift size={80} color="#2d9e2d" strokeWidth={1.2} />
                                }
                            </div>

                            {/* Discount badge */}
                            {savingsPct > 0 && (
                                <div style={{
                                    position: "absolute", top: 18, left: 18, zIndex: 2,
                                    background: "linear-gradient(135deg, #ff6b35, #e53935)",
                                    color: "#fff", fontSize: 12, fontWeight: 800,
                                    padding: "4px 10px", borderRadius: 6,
                                }}>{savingsPct}% OFF</div>
                            )}

                            {/* COMBO badge */}
                            <div style={{
                                position: "absolute", top: 18, right: 18, zIndex: 2,
                                background: "rgba(255,255,255,0.92)", border: "1.5px solid #c8e6c9",
                                color: "#1b5e20", fontSize: 11, fontWeight: 800,
                                padding: "3px 10px", borderRadius: 6,
                                display: "flex", alignItems: "center", gap: 4,
                            }}>
                                🎁 COMBO
                            </div>

                            {allImages.length > 0 && (
                                <div style={{
                                    position: "absolute", bottom: 18, right: 18, zIndex: 2,
                                    background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 6,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <ZoomIn size={16} color="#fff" />
                                </div>
                            )}
                        </div>

                        {/* ── Products included — LEFT column on desktop ── */}
                        {!isMobile && (combo.products || []).length > 0 && (
                            <div style={card}>
                                <h3 style={{
                                    margin: "0 0 12px", fontSize: 14, fontWeight: 800,
                                    color: "#1a2332", display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <Gift size={15} color="#2d9e2d" />
                                    Includes {combo.products.length} Products
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {combo.products.map((p, i) => (
                                        <ProductRow key={p.id || i} p={p} isMobile={isMobile} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT — Info Panel ══ */}
                    <div style={{ position: isMobile ? "static" : "sticky", top: 80 }}>
                        <div style={card}>

                            {/* Top row — badges + actions */}
                            <div style={{
                                display: "flex", alignItems: "center",
                                justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap",
                            }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 800, color: "#2d9e2d",
                                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                                        padding: "2px 10px", borderRadius: 6,
                                    }}>🎁 COMBO DEAL</span>
                                    {combo.discountLabel && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, color: "#e65100",
                                            background: "#fff3e0", border: "1px solid #ffe0b2",
                                            padding: "2px 10px", borderRadius: 6,
                                        }}>{combo.discountLabel}</span>
                                    )}
                                </div>

                                {/* Share + Wishlist */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={handleShare} style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        border: "1.5px solid #e5e7eb", background: "#fff",
                                        cursor: "pointer", display: "flex", alignItems: "center",
                                        justifyContent: "center", color: "#6b7280", transition: "all 0.15s",
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
                                    ><Share2 size={14} /></button>

                                    <button onClick={handleWishlist} disabled={wishLoading} style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        border: `1.5px solid ${wished ? "#fca5a5" : "#e5e7eb"}`,
                                        background: wished ? "#fef2f2" : "#fff",
                                        cursor: wishLoading ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.15s",
                                    }}>
                                        {wishLoading
                                            ? <Loader2 size={14} color="#ef4444" style={{ animation: "spin 0.7s linear infinite" }} />
                                            : <Heart size={14} fill={wished ? "#ef4444" : "none"} color={wished ? "#ef4444" : "#6b7280"} />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Combo Name */}
                            <h1 style={{
                                margin: "0 0 8px", fontSize: isMobile ? 20 : 24,
                                fontWeight: 900, color: "#1a2332", lineHeight: 1.25,
                            }}>{combo.name}</h1>

                            {/* Description */}
                            {combo.description && (
                                <p style={{
                                    margin: "0 0 12px", fontSize: 13, color: "#6b7280", lineHeight: 1.65,
                                }}>{combo.description}</p>
                            )}

                            <div style={{ borderTop: "1px dashed #f0f0f0", margin: "12px 0" }} />

                            {/* Price Block */}
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: isMobile ? 28 : 34, fontWeight: 900, color: "#16a34a" }}>
                                    ₹{comboPrice.toFixed(2)}
                                </span>
                                {totalMrp > comboPrice && (
                                    <span style={{
                                        fontSize: 16, color: "#9ca3af",
                                        textDecoration: "line-through", fontWeight: 500,
                                    }}>₹{totalMrp.toFixed(2)}</span>
                                )}
                                {savingsPct > 0 && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 800, background: "#fef2f2",
                                        color: "#ef4444", border: "1px solid #fecaca",
                                        borderRadius: 5, padding: "2px 8px",
                                    }}>Save {savingsPct}%</span>
                                )}
                            </div>

                            {/* Savings highlight */}
                            {savings > 0 && (
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                                    border: "1px solid #bbf7d0", borderRadius: 8,
                                    padding: "6px 14px", marginBottom: 14, fontSize: 13, fontWeight: 700,
                                    color: "#16a34a",
                                }}>
                                    🎉 You save ₹{savings.toFixed(2)} on this combo!
                                </div>
                            )}

                            {/* Stock Status */}
                            <div style={{ marginBottom: 16 }}>
                                {isOOS ? (
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        fontSize: 12, fontWeight: 700, color: "#dc2626",
                                        background: "#fef2f2", border: "1px solid #fecaca",
                                        padding: "4px 10px", borderRadius: 6,
                                    }}>❌ Out of Stock</span>
                                ) : isLow ? (
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        fontSize: 12, fontWeight: 700, color: "#d97706",
                                        background: "#fffbeb", border: "1px solid #fde68a",
                                        padding: "4px 10px", borderRadius: 6,
                                    }}>⚠️ Only {stock} left!</span>
                                ) : (
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        fontSize: 12, fontWeight: 700, color: "#16a34a",
                                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                                        padding: "4px 10px", borderRadius: 6,
                                    }}><CheckCircle size={12} /> In Stock ({stock} combos available)</span>
                                )}
                            </div>

                            {/* Products count badge */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                marginBottom: 16, flexWrap: "wrap",
                            }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    fontSize: 12, color: "#6b7280", background: "#f9fafb",
                                    border: "1px solid #e5e7eb", padding: "4px 10px", borderRadius: 6,
                                }}>
                                    <Package size={12} />
                                    {combo.products?.length || 0} Products Included
                                </div>
                                {combo.startDate && (
                                    <div style={{
                                        fontSize: 12, color: "#6b7280", background: "#f9fafb",
                                        border: "1px solid #e5e7eb", padding: "4px 10px", borderRadius: 6,
                                    }}>
                                        <Tag size={11} style={{ marginRight: 4 }} />
                                        Valid till {new Date(combo.endDate || combo.startDate).toLocaleDateString("en-IN")}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: "1px dashed #f0f0f0", margin: "0 0 16px" }} />

                            {/* Quantity Selector */}
                            {!isOOS && (
                                <div style={{ marginBottom: 18 }}>
                                    <p style={{
                                        margin: "0 0 8px", fontSize: 12, fontWeight: 700,
                                        color: "#374151", letterSpacing: "0.3px",
                                    }}>Quantity</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            display: "flex", alignItems: "center",
                                            border: "2px solid #e5e7eb", borderRadius: 10, overflow: "hidden",
                                        }}>
                                            <button
                                                onClick={() => setQty(q => Math.max(1, q - 1))}
                                                style={{
                                                    width: 40, height: 40, border: "none", background: "#f9fafb",
                                                    cursor: "pointer", display: "flex", alignItems: "center",
                                                    justifyContent: "center", color: "#374151", transition: "background 0.15s",
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                                            ><Minus size={14} /></button>
                                            <span style={{
                                                minWidth: 48, textAlign: "center", fontSize: 15,
                                                fontWeight: 800, color: "#111",
                                                borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb",
                                                lineHeight: "40px",
                                            }}>{qty}</span>
                                            <button
                                                onClick={() => setQty(q => Math.min(stock, q + 1))}
                                                style={{
                                                    width: 40, height: 40, border: "none", background: "#f9fafb",
                                                    cursor: "pointer", display: "flex", alignItems: "center",
                                                    justifyContent: "center", color: "#374151", transition: "background 0.15s",
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                                            ><Plus size={14} /></button>
                                        </div>
                                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                            Total: <strong style={{ color: "#16a34a" }}>₹{(comboPrice * qty).toFixed(2)}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* CTA Buttons */}
                            {/* CTA Buttons */}
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="cd-btn-cart" onClick={handleAddToCart}
                                    disabled={isOOS || cartLoading}>
                                    {cartLoading
                                        ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} />
                                        : <ShoppingCart size={16} />
                                    }
                                    {cartLoading ? "Adding…" : isOOS ? "Out of Stock" : "Add to Cart"}
                                </button>
                                <button className="cd-btn-buy" onClick={handleBuyNow} disabled={isOOS}>
                                    {isOOS ? "Unavailable" : "Buy Now"}
                                </button>
                            </div>
                        </div>

                        {/* ── Products included — RIGHT column on mobile ── */}
                        {isMobile && (combo.products || []).length > 0 && (
                            <div style={card}>
                                <h3 style={{
                                    margin: "0 0 12px", fontSize: 14, fontWeight: 800,
                                    color: "#1a2332", display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <Gift size={15} color="#2d9e2d" />
                                    Includes {combo.products.length} Products
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {combo.products.map((p, i) => (
                                        <ProductRow key={p.id || i} p={p} isMobile={isMobile} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Description card (if not shown above) ── */}
                        {combo.description && (
                            <div style={card}>
                                <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1a2332" }}>
                                    About This Combo
                                </h2>
                                <p style={{
                                    margin: 0, fontSize: 13, color: "#374151",
                                    lineHeight: 1.75, whiteSpace: "pre-line",
                                }}>{combo.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Lightbox ── */}
            {lightboxIdx !== null && allImages.length > 0 && (
                <Lightbox images={allImages} activeIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}

            {/* ── Toast ── */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
            )}
        </div>
    );
}