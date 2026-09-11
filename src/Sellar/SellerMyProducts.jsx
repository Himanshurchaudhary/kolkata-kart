// src/Sellar/SellerMyProducts.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Package, Plus, RefreshCw, Search, X,
  Clock, CheckCircle, XCircle, Eye,
  Image, ChevronRight, Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("sellerToken");

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
  pending:  { label: "Pending Review", color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: Clock },
  approved: { label: "Approved",       color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: CheckCircle },
  rejected: { label: "Rejected",       color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: XCircle },
};

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 99, padding: "3px 9px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <Icon size={11} />
      {s.label}
    </span>
  );
}

// ── Product Image ──────────────────────────────────────────────
function ProductImage({ src, size = 56 }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
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
        <Image size={size * 0.38} color="#d1d5db" />
      )}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────
function ProductDetailModal({ product, onClose }) {
  const [activeImg, setActiveImg] = useState(0);

  const allImages = [product.thumbnail, ...(product.additionalImages || [])]
    .filter(Boolean);

  const s = STATUS[product.status] || STATUS.pending;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff",
        borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 560,
        maxHeight: "90vh",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        animation: "slideUp .3s ease",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{
          padding: "16px 18px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>
            Product Details
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#f3f4f6", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

          {/* Images */}
          {allImages.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: "100%", height: 200,
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
                        width: 52, height: 52, borderRadius: 8,
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

          {/* Status */}
          <div style={{ marginBottom: 12 }}>
            <StatusBadge status={product.status} />
            {product.status === "pending" && (
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                Your product is under admin review. It will go live once approved.
              </p>
            )}
            {product.status === "rejected" && (
              <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>
                This product was rejected by admin. Please contact support for details.
              </p>
            )}
          </div>

          {/* Name */}
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px" }}>
            {product.name}
          </h2>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
            {product.category_name} · SKU: {product.sku || "—"}
          </div>

          {/* Price + Stock */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: 10, marginBottom: 14,
          }}>
            {[
              { label: "MRP",           value: product.buyingPrice  ? `₹${product.buyingPrice}`  : "—" },
              { label: "Selling Price", value: product.sellingPrice ? `₹${product.sellingPrice}` : "—" },
              { label: "Stock",         value: `${product.stockQuantity ?? "—"} units` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#f9fafb", borderRadius: 10,
                padding: "10px 12px", textAlign: "center",
                border: "1px solid #e5e7eb",
              }}>
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>
                  {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", marginTop: 2 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase" }}>
                Short Description
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                {product.shortDescription}
              </div>
            </div>
          )}

          {/* Full Description */}
          {product.description && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5, textTransform: "uppercase" }}>
                Description
              </div>
              <div
                style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Submitted on */}
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
            Submitted: {new Date(product.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 18px",
          borderTop: "1px solid #f0f0f0", flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "13px",
              background: "#f3f4f6", border: "none",
              borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: "#374151", cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────
function ProductCard({ product, onView }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
    }}>
      <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px" }}>
        <ProductImage src={product.thumbnail} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#1a1a1a",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 3,
          }}>
            {product.name}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
            {product.category_name || "—"}
          </div>
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Price + action */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px 12px",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#2d5a1b" }}>
            ₹{product.sellingPrice}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Stock: {product.stockQuantity ?? "—"} units
          </div>
        </div>
        <button
          onClick={() => onView(product)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#f0fdf4", color: "#3a7d1e",
            border: "1px solid #bbf7d0",
            borderRadius: 10, padding: "8px 14px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Eye size={13} /> View Details
        </button>
      </div>

      {/* Status info bar */}
      {product.status === "pending" && (
        <div style={{
          background: "#fff7ed", borderTop: "1px solid #fed7aa",
          padding: "8px 14px", fontSize: 11, color: "#92400e", fontWeight: 600,
        }}>
          ⏳ Awaiting admin review — not visible on website yet
        </div>
      )}
      {product.status === "approved" && (
        <div style={{
          background: "#f0fdf4", borderTop: "1px solid #bbf7d0",
          padding: "8px 14px", fontSize: 11, color: "#166534", fontWeight: 600,
        }}>
          ✓ Live on website — customers can see this product
        </div>
      )}
      {product.status === "rejected" && (
        <div style={{
          background: "#fef2f2", borderTop: "1px solid #fca5a5",
          padding: "8px 14px", fontSize: 11, color: "#991b1b", fontWeight: 600,
        }}>
          ✕ Rejected — contact support for details
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function SellerMyProducts() {
  const navigate = useNavigate();
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [viewProduct, setViewProduct] = useState(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res  = await authFetch("/api/seller/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Stats
  const counts = {
    all:      products.length,
    pending:  products.filter(p => p.status === "pending").length,
    approved: products.filter(p => p.status === "approved").length,
    rejected: products.filter(p => p.status === "rejected").length,
  };

  // Filter + search
  const visible = products.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const TABS = [
    { key: "all",      label: "All",      color: "#6b7280" },
    { key: "pending",  label: "Pending",  color: "#f97316" },
    { key: "approved", label: "Live",     color: "#16a34a" },
    { key: "rejected", label: "Rejected", color: "#dc2626" },
  ];

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", gap: 10, color: "#6b7280", fontSize: 14,
    }}>
      <div style={{
        width: 22, height: 22,
        border: "2.5px solid #e5e7eb",
        borderTopColor: "#3a7d1e",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading your products…
    </div>
  );

  // ── Empty state (no products at all) ──────────────────────
  if (products.length === 0) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "70vh", padding: "24px 16px", textAlign: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#f0fdf4", border: "1px solid #bbf7d0",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
      }}>
        <Package size={30} color="#3a7d1e" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>
        No Products Yet
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 280, lineHeight: 1.7, margin: "0 0 24px" }}>
        You haven't added any products yet. Add your first product and submit it for admin approval.
      </p>
      <button
        onClick={() => navigate("/seller/add-product")}
        style={{
          background: "linear-gradient(135deg,#2d5a1b,#3a7d1e)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: "13px 24px", fontSize: 14, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Plus size={18} /> Add First Product
      </button>
    </div>
  );

  // ── Main render ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#f8faf8",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── Sticky Header ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "14px 16px 0",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Title row */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
              My Products
            </h1>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>
              {counts.all} product{counts.all !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
                size={15} color="#3a7d1e"
                style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }}
              />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
            <button
              onClick={() => navigate("/seller/add-product")}
              style={{
                height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#2d5a1b,#3a7d1e)",
                border: "none", color: "#fff",
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 14px", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Add Product
            </button>
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {[
            { label: "Total",    value: counts.all,      color: "#6b7280", bg: "#f3f4f6" },
            { label: "Pending",  value: counts.pending,  color: "#f97316", bg: "#fff7ed" },
            { label: "Live",     value: counts.approved, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Rejected", value: counts.rejected, color: "#dc2626", bg: "#fef2f2" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{
              background: bg, borderRadius: 10,
              padding: "6px 14px", flexShrink: 0, textAlign: "center",
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 10, color, fontWeight: 700, opacity: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ margin: "10px 0 0", position: "relative" }}>
          <Search size={14} color="#9ca3af" style={{
            position: "absolute", left: 11, top: "50%",
            transform: "translateY(-50%)",
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{
              width: "100%", padding: "9px 12px 9px 34px",
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
                cursor: "pointer", display: "flex",
              }}
            >
              <X size={13} color="#9ca3af" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 4, overflowX: "auto",
          padding: "10px 0", scrollbarWidth: "none",
        }}>
          {TABS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "6px 14px", borderRadius: 99, flexShrink: 0,
                border: filter === key ? `1.5px solid ${color}` : "1.5px solid #e5e7eb",
                background: filter === key ? color : "#fff",
                color: filter === key ? "#fff" : "#6b7280",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {label}
              <span style={{
                background: filter === key ? "rgba(255,255,255,.25)" : "#f3f4f6",
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

      {/* ── Product List ── */}
      <div style={{ padding: "14px 16px 32px" }}>
        {visible.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: 240, gap: 10, color: "#9ca3af", textAlign: "center",
          }}>
            <Package size={36} color="#e5e7eb" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6b7280" }}>
                No products found
              </div>
              <div style={{ fontSize: 12, marginTop: 3 }}>
                {search ? "Try a different search" : "No products in this category"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {visible.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onView={setViewProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  );
}