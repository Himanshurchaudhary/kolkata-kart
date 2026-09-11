// src/auth/Pages/SellerProductsApproval.jsx
import { useState, useEffect, useCallback } from "react";
import {
    CheckCircle, XCircle, Clock, Eye, X,
    Search, RefreshCw, Store, Package,
    ChevronDown, AlertCircle, Image,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("adminToken");

const authFetch = (url, opts = {}) =>
    fetch(`${API}${url}`, {
        ...opts,
        headers: {
            Authorization: `Bearer ${token()}`,
            ...(opts.headers || {}),
        },
    });

// ── Status config ──────────────────────────────────────────────
const STATUS = {
    pending: { label: "Pending", color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: Clock },
    approved: { label: "Approved", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: CheckCircle },
    rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: XCircle },
};

// ── Toast ──────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [toast, onClose]);

    if (!toast) return null;
    const ok = toast.type === "success";
    return (
        <div style={{
            position: "fixed", bottom: 20, left: "50%",
            transform: "translateX(-50%)",
            background: ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${ok ? "#86efac" : "#fca5a5"}`,
            color: ok ? "#166534" : "#991b1b",
            borderRadius: 12, padding: "12px 20px",
            fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,.15)",
            zIndex: 9999, maxWidth: "calc(100vw - 32px)",
            whiteSpace: "nowrap",
            animation: "slideUp .25s ease",
        }}>
            {ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {toast.message}
            <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
        </div>
    );
}

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.pending;
    const Icon = s.icon;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            borderRadius: 99, padding: "3px 10px",
            fontSize: 11, fontWeight: 700,
        }}>
            <Icon size={12} />
            {s.label}
        </span>
    );
}

// ── Image with fallback ────────────────────────────────────────
function ProductImage({ src, size = 48, radius = 8 }) {
    const [err, setErr] = useState(false);
    return (
        <div style={{
            width: size, height: size, borderRadius: radius,
            overflow: "hidden", flexShrink: 0,
            background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #e5e7eb",
        }}>
            {!err && src ? (
                <img
                    src={src} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setErr(true)}
                />
            ) : (
                <Image size={size * 0.4} color="#d1d5db" />
            )}
        </div>
    );
}

// ── Detail Modal ───────────────────────────────────────────────
function ProductDetailModal({ productId, onClose, onStatusChange }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        authFetch(`/api/auth/seller-products/${productId}`)
            .then(r => r.json())
            .then(d => setProduct(d.product))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [productId]);

    const updateStatus = async (status) => {
        setUpdating(true);
        try {
            const res = await authFetch(
                `/api/auth/seller-products/${productId}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                onStatusChange(productId, status);
                setProduct(p => ({ ...p, status }));
            }
        } catch { }
        setUpdating(false);
    };

    const allImages = product
        ? [product.thumbnail, ...(product.additionalImages || [])].filter(Boolean)
        : [];

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.5)",
            display: "flex", alignItems: "flex-end",
            justifyContent: "center",
            padding: 0,
        }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: "#fff",
                borderRadius: "20px 20px 0 0",
                width: "100%", maxWidth: 600,
                maxHeight: "92vh",
                overflow: "hidden",
                display: "flex", flexDirection: "column",
                animation: "slideModalUp .3s ease",
            }}>
                <style>{`@keyframes slideModalUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

                {/* Modal header */}
                <div style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexShrink: 0,
                }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>
                        Product Details
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "#f3f4f6", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <X size={16} color="#6b7280" />
                    </button>
                </div>

                {/* Modal body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                    {loading ? (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            height: 200, gap: 10, color: "#6b7280", fontSize: 14,
                        }}>
                            <div style={{
                                width: 20, height: 20,
                                border: "2.5px solid #e5e7eb",
                                borderTopColor: "#3a7d1e",
                                borderRadius: "50%",
                                animation: "spin .7s linear infinite",
                            }} />
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            Loading…
                        </div>
                    ) : product ? (
                        <>
                            {/* Images */}
                            {allImages.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{
                                        width: "100%", height: 220,
                                        borderRadius: 14, overflow: "hidden",
                                        background: "#f3f4f6", marginBottom: 10,
                                        border: "1px solid #e5e7eb",
                                    }}>
                                        <img
                                            src={allImages[activeImg]} alt=""
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        />
                                    </div>
                                    {allImages.length > 1 && (
                                        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                                            {allImages.map((img, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setActiveImg(i)}
                                                    style={{
                                                        width: 56, height: 56, borderRadius: 8,
                                                        overflow: "hidden", flexShrink: 0, cursor: "pointer",
                                                        border: `2px solid ${activeImg === i ? "#3a7d1e" : "#e5e7eb"}`,
                                                    }}
                                                >
                                                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Status + name */}
                            <div style={{ marginBottom: 16 }}>
                                <StatusBadge status={product.status} />
                                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: "8px 0 4px" }}>
                                    {product.name}
                                </h2>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>
                                    {product.category_name} · SKU: {product.sku}
                                </div>
                            </div>

                            {/* Seller info */}
                            <div style={{
                                background: "#f0fdf4", border: "1px solid #bbf7d0",
                                borderRadius: 12, padding: "12px 14px", marginBottom: 14,
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>
                                    Seller Info
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#2d5a1b" }}>
                                    {product.seller_name}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    {product.shop_name} · {product.seller_email}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: 10, marginBottom: 14,
                            }}>
                                {[
                                    { label: "MRP", value: product.buyingPrice ? `₹${product.buyingPrice}` : "—" },
                                    { label: "Selling Price", value: `₹${product.sellingPrice}` },
                                    { label: "Stock", value: `${product.stockQuantity} units` },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{
                                        background: "#f9fafb", borderRadius: 10,
                                        padding: "10px 12px", textAlign: "center",
                                        border: "1px solid #e5e7eb",
                                    }}>
                                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginTop: 2 }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            {/* Description */}
                            {(product.description || product.shortDescription) && (
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>
                                        Description
                                    </div>
                                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                                        {product.description || product.shortDescription}
                                    </div>
                                </div>
                            )}

                            {/* Short Description */}
                            {product.shortDescription && product.description !== product.shortDescription && (
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>
                                        Short Description
                                    </div>
                                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                                        {product.shortDescription}
                                    </div>
                                </div>
                            )}

                            {/* Submitted on */}
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>
                                Submitted: {new Date(product.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
                            Product not found.
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                {product && (
                    <div style={{
                        padding: "14px 20px",
                        borderTop: "1px solid #f0f0f0",
                        display: "flex", gap: 10, flexShrink: 0,
                    }}>
                        {product.status !== "approved" && (
                            <button
                                onClick={() => updateStatus("approved")}
                                disabled={updating}
                                style={{
                                    flex: 1,
                                    background: updating ? "#9ca3af" : "linear-gradient(135deg,#16a34a,#22c55e)",
                                    color: "#fff", border: "none", borderRadius: 12,
                                    padding: "13px", fontSize: 14, fontWeight: 700,
                                    cursor: updating ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                }}
                            >
                                <CheckCircle size={17} /> Approve
                            </button>
                        )}
                        {product.status !== "rejected" && (
                            <button
                                onClick={() => updateStatus("rejected")}
                                disabled={updating}
                                style={{
                                    flex: 1,
                                    background: updating ? "#9ca3af" : "#fef2f2",
                                    color: "#dc2626", border: "1px solid #fca5a5",
                                    borderRadius: 12, padding: "13px",
                                    fontSize: 14, fontWeight: 700,
                                    cursor: updating ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                }}
                            >
                                <XCircle size={17} /> Reject
                            </button>
                        )}
                        {product.status !== "pending" && (
                            <button
                                onClick={() => updateStatus("pending")}
                                disabled={updating}
                                style={{
                                    flex: 1,
                                    background: "#fff7ed",
                                    color: "#f97316", border: "1px solid #fed7aa",
                                    borderRadius: 12, padding: "13px",
                                    fontSize: 14, fontWeight: 700,
                                    cursor: updating ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                }}
                            >
                                <Clock size={17} /> Set Pending
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Product Card (mobile) ──────────────────────────────────────
function ProductCard({ product, onView, onStatusChange }) {
    const [updating, setUpdating] = useState(null);

    const updateStatus = async (status) => {
        setUpdating(status);
        try {
            const res = await authFetch(
                `/api/auth/seller-products/${product.id}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                }
            );
            if (res.ok) onStatusChange(product.id, status);
        } catch { }
        setUpdating(null);
    };

    return (
        <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        }}>
            {/* Top row */}
            <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px" }}>
                <ProductImage src={product.thumbnail} size={56} radius={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 14, fontWeight: 700, color: "#1a1a1a",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                        {product.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {product.category_name}
                    </div>
                    <div style={{ marginTop: 5 }}>
                        <StatusBadge status={product.status} />
                    </div>
                </div>
            </div>

            {/* Seller + price row */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                padding: "0 14px 10px", alignItems: "center",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Store size={12} color="#9ca3af" />
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                        {product.shop_name || product.seller_name}
                    </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2d5a1b" }}>
                    ₹{product.sellingPrice}
                </div>
            </div>

            {/* Action row */}
            <div style={{
                display: "flex", gap: 0,
                borderTop: "1px solid #f0f0f0",
            }}>
                <button
                    onClick={() => onView(product.id)}
                    style={{
                        flex: 1, padding: "11px",
                        background: "none", border: "none",
                        borderRight: "1px solid #f0f0f0",
                        color: "#3a7d1e", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                >
                    <Eye size={14} /> View
                </button>

                {product.status !== "approved" && (
                    <button
                        onClick={() => updateStatus("approved")}
                        disabled={!!updating}
                        style={{
                            flex: 1, padding: "11px",
                            background: updating === "approved" ? "#f0fdf4" : "none",
                            border: "none",
                            borderRight: product.status !== "rejected" ? "1px solid #f0f0f0" : "none",
                            color: "#16a34a", fontSize: 12, fontWeight: 700,
                            cursor: updating ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                    >
                        <CheckCircle size={14} />
                        {updating === "approved" ? "…" : "Approve"}
                    </button>
                )}

                {product.status !== "rejected" && (
                    <button
                        onClick={() => updateStatus("rejected")}
                        disabled={!!updating}
                        style={{
                            flex: 1, padding: "11px",
                            background: updating === "rejected" ? "#fef2f2" : "none",
                            border: "none",
                            color: "#dc2626", fontSize: 12, fontWeight: 700,
                            cursor: updating ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                    >
                        <XCircle size={14} />
                        {updating === "rejected" ? "…" : "Reject"}
                    </button>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function SellerProductsApproval() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [viewId, setViewId] = useState(null);
    const [toast, setToast] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const showToast = (message, type = "success") =>
        setToast({ message, type });

    const fetchProducts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const url = filter === "all"
                ? "/api/auth/seller-products"
                : `/api/auth/seller-products?status=${filter}`;
            const res = await authFetch(url);
            const data = await res.json();
            setProducts(data.products || []);
        } catch {
            showToast("Failed to load products", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleStatusChange = (id, status) => {
        setProducts(p =>
            p.map(prod => prod.id === id ? { ...prod, status } : prod)
        );
        showToast(
            status === "approved"
                ? "Product approved successfully"
                : status === "rejected"
                    ? "Product rejected"
                    : "Status updated"
        );
    };

    // Filtered + searched
    const visible = products.filter(p => {
        const matchSearch =
            !search ||
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.seller_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.shop_name?.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    // Stats
    const counts = {
        all: products.length,
        pending: products.filter(p => p.status === "pending").length,
        approved: products.filter(p => p.status === "approved").length,
        rejected: products.filter(p => p.status === "rejected").length,
    };

    const TABS = [
        { key: "all", label: "All", color: "#6b7280" },
        { key: "pending", label: "Pending", color: "#f97316" },
        { key: "approved", label: "Approved", color: "#16a34a" },
        { key: "rejected", label: "Rejected", color: "#dc2626" },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f8faf8",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
            {/* ── Header ── */}
            <div style={{
                background: "#fff",
                borderBottom: "1px solid #e5e7eb",
                padding: "16px 16px 0",
                position: "sticky", top: 0, zIndex: 50,
            }}>
                {/* Title row */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 14,
                }}>
                    <div>
                        <h1 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
                            Seller Products
                        </h1>
                        <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>
                            Review and approve seller product submissions
                        </p>
                    </div>
                    <button
                        onClick={() => fetchProducts(true)}
                        disabled={refreshing}
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <RefreshCw
                            size={16} color="#3a7d1e"
                            style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }}
                        />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </button>
                </div>

                {/* Stats pills */}
                <div style={{
                    display: "flex", gap: 8, overflowX: "auto",
                    paddingBottom: 2,
                    scrollbarWidth: "none",
                }}>
                    {[
                        { label: "Total", value: counts.all, color: "#6b7280", bg: "#f3f4f6" },
                        { label: "Pending", value: counts.pending, color: "#f97316", bg: "#fff7ed" },
                        { label: "Approved", value: counts.approved, color: "#16a34a", bg: "#f0fdf4" },
                        { label: "Rejected", value: counts.rejected, color: "#dc2626", bg: "#fef2f2" },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{
                            background: bg, borderRadius: 10,
                            padding: "6px 14px", flexShrink: 0,
                            textAlign: "center",
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                            <div style={{ fontSize: 10, color, fontWeight: 700, opacity: 0.8 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{
                    margin: "12px 0 0",
                    position: "relative",
                }}>
                    <Search size={15} color="#9ca3af" style={{
                        position: "absolute", left: 12, top: "50%",
                        transform: "translateY(-50%)",
                    }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by product or seller name…"
                        style={{
                            width: "100%", padding: "10px 12px 10px 36px",
                            border: "1px solid #e5e7eb", borderRadius: 10,
                            fontSize: 13, outline: "none",
                            background: "#f9fafb", boxSizing: "border-box",
                            fontFamily: "inherit",
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            style={{
                                position: "absolute", right: 10, top: "50%",
                                transform: "translateY(-50%)",
                                background: "none", border: "none",
                                cursor: "pointer", color: "#9ca3af",
                                display: "flex", alignItems: "center",
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div style={{
                    display: "flex", gap: 4,
                    overflowX: "auto", padding: "10px 0",
                    scrollbarWidth: "none",
                }}>
                    {TABS.map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            style={{
                                padding: "7px 14px", borderRadius: 99, flexShrink: 0,
                                border: filter === key
                                    ? `1.5px solid ${color}`
                                    : "1.5px solid #e5e7eb",
                                background: filter === key ? color : "#fff",
                                color: filter === key ? "#fff" : "#6b7280",
                                fontSize: 12, fontWeight: 700,
                                cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5,
                            }}
                        >
                            {label}
                            <span style={{
                                background: filter === key
                                    ? "rgba(255,255,255,.25)"
                                    : "#f3f4f6",
                                color: filter === key ? "#fff" : "#6b7280",
                                borderRadius: 99, padding: "1px 6px",
                                fontSize: 10, fontWeight: 800,
                            }}>
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ padding: "14px 16px 32px" }}>
                {loading ? (
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        height: 300, gap: 12, color: "#6b7280",
                    }}>
                        <div style={{
                            width: 36, height: 36,
                            border: "3px solid #e5e7eb",
                            borderTopColor: "#3a7d1e",
                            borderRadius: "50%",
                            animation: "spin .7s linear infinite",
                        }} />
                        <span style={{ fontSize: 14 }}>Loading products…</span>
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        height: 280, gap: 12, color: "#9ca3af",
                        textAlign: "center",
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: "50%",
                            background: "#f3f4f6",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Package size={28} color="#d1d5db" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#6b7280" }}>
                                No products found
                            </div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                                {search ? "Try a different search" : "No submissions yet"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            fontSize: 12, color: "#9ca3af",
                            fontWeight: 600, marginBottom: 10,
                        }}>
                            Showing {visible.length} product{visible.length !== 1 ? "s" : ""}
                        </div>

                        {/* Card grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: 12,
                        }}>
                            {visible.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onView={setViewId}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {viewId && (
                <ProductDetailModal
                    productId={viewId}
                    onClose={() => setViewId(null)}
                    onStatusChange={(id, status) => {
                        handleStatusChange(id, status);
                    }}
                />
            )}

            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}