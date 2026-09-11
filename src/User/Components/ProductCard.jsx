// src/components/ProductCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Reusable ProductCard — works on HomePage, Wishlist, ProductsPage, SearchPage
// Pass any product object from any API endpoint; all field variations handled.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openLoginModal } from "../utils/authEvents";
import { addToCart, toggleWishlist, fetchWishlist } from "../utils/cartWishlist";

// ─── Responsive Hook ──────────────────────────────────────────────────────────
const useResponsive = () => {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 600,
    isTablet: width >= 600 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? "#e74c3c" : "none"}
    stroke={filled ? "#e74c3c" : "#bbb"}
    strokeWidth="2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg
    width="11" height="11" viewBox="0 0 24 24"
    fill={filled ? "#f39c12" : "#ddd"}
    stroke={filled ? "#f39c12" : "#ddd"}
    strokeWidth="1"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarRating = ({ rating = 4 }) => (
  <span style={{ display: "flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <StarIcon key={i} filled={i <= Math.round(rating)} />
    ))}
  </span>
);

// ─── Field Normaliser ─────────────────────────────────────────────────────────
// Handles every field variation seen across your API endpoints:
//
//  Price fields from API:
//    product.sellingPrice   → the actual selling / display price
//    product.price          → sometimes used as selling price
//    product.buyingPrice    → cost price (used as strike-through / old price)
//    product.oldPrice       → explicit old / MRP field
//    product.discountPrice  → occasionally used instead of sellingPrice
//    product.mrp            → Maximum Retail Price (strike-through)
//
//  Image fields from API:
//    product.thumbnail      → primary image (most common)
//    product.image          → alternate single-image field
//    product.images[]       → array of images, take first
//    product.additionalImages[] → secondary images array
//
//  Name fields:
//    product.name  |  product.title
//
//  Category fields:
//    product.category (string name)
//    product.category (object { id, name })
//    product.categoryName
//
//  Stock fields:
//    product.stockQuantity  |  product.stock  |  product.quantity
//
//  Unit / weight:
//    product.unit  |  product.weight  |  product.unitLabel
//
//  Navigation:
//    product.slug   → used for /products/:slug
//    product.id     → fallback navigate to /products/:id

const normalise = (product) => {
  if (!product) return {};

  // ── Display price (what customer pays) ──
  const displayPrice = Number(
    product.sellingPrice ??
    product.discountPrice ??
    product.price ??
    0
  );

  // ── Strike price (original / MRP) — only show if different from display ──
  const rawStrike = Number(
    product.mrp ??
    product.oldPrice ??
    product.buyingPrice ??
    0
  );
  const strikePrice = rawStrike > displayPrice ? rawStrike : null;

  // ── Discount % ──
  const discountPct =
    strikePrice && displayPrice > 0
      ? Math.round((1 - displayPrice / strikePrice) * 100)
      : null;

  // ── Image ──
  const image =
    product.thumbnail ||
    product.image ||
    product.images?.[0] ||
    product.additionalImages?.[0] ||
    null;

  // ── Name ──
  const name = product.name || product.title || "Product";

  // ── Category label ──
  const category =
    typeof product.category === "object"
      ? product.category?.name || ""
      : product.category || product.categoryName || "";

  // ── Stock ──
  const stock = Number(
    product.stockQuantity ?? product.stock ?? product.quantity ?? 0
  );
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;

  // ── Unit ──
  const unit = product.unit || product.weight || product.unitLabel || "";

  // ── Navigation slug ──
  const navSlug = product.slug || product.id || null;

  // ── Rating ──
  const rating = Number(product.rating || product.averageRating || 4);

  return {
    displayPrice,
    strikePrice,
    discountPct,
    image,
    name,
    category,
    stock,
    isOutOfStock,
    isLowStock,
    unit,
    navSlug,
    rating,
  };
};

// ─── ProductCard Component ────────────────────────────────────────────────────
/**
 * Props:
 *  product   {object}   — raw product object from any API endpoint (required)
 *  onUnwish  {function} — optional callback(productId) called after un-wishlisting
 *                         useful on Wishlist page to remove the card from the list
 */
const ProductCard = ({ product, onUnwish }) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const {
    displayPrice,
    strikePrice,
    discountPct,
    image,
    name,
    category,
    stock,
    isOutOfStock,
    isLowStock,
    unit,
    navSlug,
    rating,
  } = normalise(product);

  // ── Auth helper ──
  const isLoggedIn = () => !!localStorage.getItem("userToken");

  // ── Load initial wishlist state ──
  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchWishlist()
      .then((data) => {
        const ids = (data.products || []).map((p) => p.id || p);
        setWished(ids.includes(product.id));
      })
      .catch(() => {});
  }, [product.id]);

  // ── Add to Cart ──
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { openLoginModal(); return; }
    if (cartLoading) return;
    setCartLoading(true);
    try {
      await addToCart(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
            window.dispatchEvent(new CustomEvent("cart:added", { detail: { name, image } }));

    } catch {
      console.log("error")
    } finally {
      setCartLoading(false);
    }
  };

  // ── Wishlist Toggle ──
  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { openLoginModal(); return; }
    try {
      await toggleWishlist(product.id, wished);
      const nowWished = !wished;
      setWished(nowWished);
      // If used on Wishlist page and user un-wishes, notify parent to remove card
      if (!nowWished && typeof onUnwish === "function") {
        onUnwish(product.id);
      }
    } catch {
      console.log("error");
    }
  };

  // ── Navigate to product detail ──
  const handleCardClick = () => {
    if (navSlug) navigate(`/products/${navSlug}`);
  };

  const imgHeight = isMobile ? 120 : 170;

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: isMobile ? "8px 8px 10px" : "10px 10px 12px",
        border: "1px solid #efefef",
        boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
        cursor: navSlug ? "pointer" : "default",
        transition: "box-shadow 0.2s, transform 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.11)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── Image Block ── */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div
          style={{
            width: "100%",
            height: imgHeight,
            background: "#f5f5f5",
            borderRadius: 7,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <span style={{ fontSize: 40 }}>🛒</span>
          )}
        </div>

        {/* Discount badge — only shown when there's a real discount */}
        {discountPct && discountPct > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              background: "#ff6b35",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: 3,
            }}
          >
            {discountPct}% off
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 26,
            height: 26,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
          }}
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      {/* ── Category ── */}
      {category ? (
        <div
          style={{
            fontSize: 10,
            color: "#2d9e2d",
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {category}
        </div>
      ) : null}

      {/* ── Product Name ── */}
      <div
        style={{
          fontSize: isMobile ? 11 : 12,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 4,
          lineHeight: 1.35,
          minHeight: isMobile ? 28 : 32,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {name}
      </div>

      {/* ── Star Rating ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
        <StarRating rating={rating} />
      </div>

      {/* ── Stock Status ── */}
      <div
        style={{
          fontSize: 10,
          marginBottom: 6,
          color: isOutOfStock ? "#e74c3c" : isLowStock ? "#e67e22" : "#bbb",
        }}
      >
        {isOutOfStock
          ? "❌ Out of Stock"
          : isLowStock
          ? `⚠️ Only ${stock} left`
          : `✅ In Stock: ${stock}`}
      </div>

      {/* ── Price Row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 13 : 14,
            fontWeight: 800,
            color: "#2d9e2d",
          }}
        >
          ₹{displayPrice.toFixed(2)}
        </span>

        {/* Strike price — only shown when different from display price */}
        {strikePrice && (
          <span
            style={{
              fontSize: 11,
              color: "#ccc",
              textDecoration: "line-through",
            }}
          >
            ₹{strikePrice.toFixed(2)}
          </span>
        )}

        {unit ? (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#999" }}>
            {unit}
          </span>
        ) : null}
      </div>

      {/* ── Add to Cart Button ── */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || cartLoading}
        style={{
          width: "100%",
          padding: "7px 0",
          background: isOutOfStock ? "#ccc" : added ? "#218c21" : "#2d9e2d",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          cursor: isOutOfStock || cartLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          transition: "background 0.2s",
          marginTop: "auto",
          opacity: cartLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isOutOfStock && !cartLoading)
            e.currentTarget.style.background = "#218c21";
        }}
        onMouseLeave={(e) => {
          if (!isOutOfStock && !cartLoading && !added)
            e.currentTarget.style.background = "#2d9e2d";
        }}
      >
        <CartIcon />
        {isOutOfStock
          ? "Out of Stock"
          : cartLoading
          ? "Adding..."
          : added
          ? "✓ Added!"
          : "Add To Cart"}
      </button>
    </div>
  );
};

export default ProductCard;