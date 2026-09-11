// src/Sellar/SellerAddProduct.jsx
import { useState, useRef, useEffect } from "react";
import {
  Camera, Plus, X, Loader, CheckCircle,
  XCircle, ChevronDown, Package,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("sellerToken");

// ── Toast ──────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
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
      boxShadow: "0 4px 20px rgba(0,0,0,.12)",
      zIndex: 9999, maxWidth: "calc(100vw - 32px)",
      animation: "slideUp .25s ease",
    }}>
      {ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {toast.message}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        color: "#6b7280", marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.5px",
      }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 13px",
  border: "1px solid #e5e7eb", borderRadius: 10,
  fontSize: 14, color: "#1a1a1a", background: "#fff",
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const Grid2 = ({ children }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "0 12px",
  }}>
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function SellerAddProduct() {
  const thumbRef = useRef();
  const galleryRef = useRef();

  const [categories, setCategories]   = useState([]);
  const [catLoading, setCatLoading]   = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState(null);
  const [submitted, setSubmitted]     = useState(false);

  // Images
  const [thumbFile, setThumbFile]     = useState(null);
  const [thumbPrev, setThumbPrev]     = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);  // max 4
  const [galleryPrevs, setGalleryPrevs] = useState([]);

  // Form
  const [form, setForm] = useState({
    name: "", shortDescription: "", description: "",
    category: "", unit: "", sku: "",
    buyingPrice: "", sellingPrice: "", stockQuantity: "",
    minOrderQuantity: "1",
  });

  // Fetch categories
  useEffect(() => {
    fetch(`${API}/api/Category/all`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setCategories(d.categories || d.data || d || []))
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Thumbnail
  const handleThumb = e => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    const reader = new FileReader();
    reader.onload = ev => setThumbPrev(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Gallery
  const handleGallery = e => {
    const files = Array.from(e.target.files);
    const remaining = 4 - galleryFiles.length;
    const toAdd = files.slice(0, remaining);
    setGalleryFiles(f => [...f, ...toAdd]);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev =>
        setGalleryPrevs(p => [...p, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeGallery = idx => {
    setGalleryFiles(f => f.filter((_, i) => i !== idx));
    setGalleryPrevs(p => p.filter((_, i) => i !== idx));
  };

  // Submit
  const handleSubmit = async () => {
    if (!form.name)          return showToast("Product name is required", "error");
    if (!form.category)      return showToast("Please select a category", "error");
    if (!form.sellingPrice)  return showToast("Selling price is required", "error");
    if (!form.stockQuantity) return showToast("Stock quantity is required", "error");
    if (!form.unit)          return showToast("Unit is required", "error");
    if (!thumbFile)          return showToast("Product thumbnail is required", "error");

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("thumbnail", thumbFile);
      galleryFiles.forEach(f => fd.append("additionalImages", f));

      const res = await fetch(`${API}/api/seller/products/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        showToast(data.message || "Failed to submit", "error");
      }
    } catch {
      showToast("Network error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: "", shortDescription: "", description: "",
      category: "", unit: "", sku: "",
      buyingPrice: "", sellingPrice: "", stockQuantity: "",
      minOrderQuantity: "1",
    });
    setThumbFile(null); setThumbPrev(null);
    setGalleryFiles([]); setGalleryPrevs([]);
    setSubmitted(false);
  };

  // ── Success screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "70vh", padding: "24px 16px", textAlign: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#f0fdf4", border: "2px solid #86efac",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}>
          <CheckCircle size={34} color="#3a7d1e" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>
          Product Submitted!
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 300, lineHeight: 1.7, margin: "0 0 24px" }}>
          Your product has been sent for admin review. It will appear on the website once approved.
        </p>
        <button
          onClick={handleReset}
          style={{
            background: "linear-gradient(135deg,#2d5a1b,#3a7d1e)",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "13px 28px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <Plus size={18} /> Add Another Product
        </button>
      </div>
    );
  }

  // ── Main Form ──────────────────────────────────────────────
  return (
    <div style={{
      padding: "16px 16px 100px",
      maxWidth: 600, margin: "0 auto",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px" }}>
          Add New Product
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Fill in product details and submit for admin approval.
        </p>
      </div>

      {/* ── Section: Thumbnail ── */}
      <div style={{
        background: "#fff", border: "1px solid #e8f5e1",
        borderRadius: 16, padding: "16px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d5a1b", marginBottom: 14 }}>
          📷 Product Images
        </div>

        {/* Thumbnail */}
        <Field label="Main Thumbnail" required>
          <div
            onClick={() => thumbRef.current?.click()}
            style={{
              width: 110, height: 110, borderRadius: 12,
              border: `2px dashed ${thumbPrev ? "#3a7d1e" : "#d1d5db"}`,
              overflow: "hidden", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: thumbPrev ? "transparent" : "#f9fafb",
              position: "relative",
            }}
          >
            {thumbPrev ? (
              <>
                <img src={thumbPrev} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0,
                  transition: "opacity .2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <Camera size={22} color="#fff" />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#9ca3af" }}>
                <Camera size={28} />
                <div style={{ fontSize: 11, marginTop: 4 }}>Tap to upload</div>
              </div>
            )}
          </div>
          <input ref={thumbRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumb} />
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
            Required · Max 2MB · JPG, PNG, WEBP
          </div>
        </Field>

        {/* Gallery */}
        <Field label="Additional Images (optional — max 4)">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {galleryPrevs.map((prev, i) => (
              <div key={i} style={{
                width: 72, height: 72, borderRadius: 10,
                overflow: "hidden", border: "1px solid #e5e7eb",
                position: "relative", flexShrink: 0,
              }}>
                <img src={prev} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => removeGallery(i)}
                  style={{
                    position: "absolute", top: 2, right: 2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#ef4444", border: "none",
                    color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                  }}
                >×</button>
              </div>
            ))}
            {galleryFiles.length < 4 && (
              <div
                onClick={() => galleryRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: 10,
                  border: "2px dashed #d1d5db",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#9ca3af", flexShrink: 0,
                  background: "#f9fafb",
                }}
              >
                <Plus size={20} />
                <span style={{ fontSize: 10, marginTop: 2 }}>Add</span>
              </div>
            )}
            <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleGallery} />
          </div>
        </Field>
      </div>

      {/* ── Section: Basic Info ── */}
      <div style={{
        background: "#fff", border: "1px solid #e8f5e1",
        borderRadius: 16, padding: "16px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d5a1b", marginBottom: 14 }}>
          📦 Product Info
        </div>

        <Field label="Product Name" required>
          <input
            name="name" value={form.name} onChange={handleChange}
            placeholder="e.g. Tata Salt 1kg"
            style={inputStyle}
          />
        </Field>

        <Field label="Category" required>
          <div style={{ position: "relative" }}>
            <select
              name="category" value={form.category} onChange={handleChange}
              style={{ ...inputStyle, appearance: "none", paddingRight: 36 }}
            >
              <option value="">
                {catLoading ? "Loading categories…" : "Select category"}
              </option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={15} color="#9ca3af" style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
            }} />
          </div>
        </Field>

        <Grid2>
          <Field label="Unit" required>
            <input
              name="unit" value={form.unit} onChange={handleChange}
              placeholder="kg / pc / litre"
              style={inputStyle}
            />
          </Field>
          <Field label="SKU (optional)">
            <input
              name="sku" value={form.sku} onChange={handleChange}
              placeholder="Auto-generated if blank"
              style={inputStyle}
            />
          </Field>
        </Grid2>

        <Field label="Short Description">
          <textarea
            name="shortDescription" value={form.shortDescription} onChange={handleChange}
            placeholder="Brief description of the product"
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <Field label="Full Description">
          <textarea
            name="description" value={form.description} onChange={handleChange}
            placeholder="Detailed product information"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>
      </div>

      {/* ── Section: Pricing ── */}
      <div style={{
        background: "#fff", border: "1px solid #e8f5e1",
        borderRadius: 16, padding: "16px", marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d5a1b", marginBottom: 14 }}>
          💰 Pricing & Stock
        </div>

        <Grid2>
          <Field label="MRP / Old Price">
            <input
              type="number" name="buyingPrice" value={form.buyingPrice}
              onChange={handleChange} placeholder="0.00" min="0" step="0.01"
              style={inputStyle}
            />
          </Field>
          <Field label="Selling Price" required>
            <input
              type="number" name="sellingPrice" value={form.sellingPrice}
              onChange={handleChange} placeholder="0.00" min="0" step="0.01"
              style={inputStyle}
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="Stock Quantity" required>
            <input
              type="number" name="stockQuantity" value={form.stockQuantity}
              onChange={handleChange} placeholder="0" min="0"
              style={inputStyle}
            />
          </Field>
          <Field label="Min Order Qty">
            <input
              type="number" name="minOrderQuantity" value={form.minOrderQuantity}
              onChange={handleChange} placeholder="1" min="1"
              style={inputStyle}
            />
          </Field>
        </Grid2>

        {/* Discount badge preview */}
        {form.buyingPrice && form.sellingPrice &&
          Number(form.buyingPrice) > Number(form.sellingPrice) && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #86efac",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, color: "#166534", fontWeight: 600,
          }}>
            🏷 Discount: ₹{(Number(form.buyingPrice) - Number(form.sellingPrice)).toFixed(2)} off
            {" "}(
            {Math.round(
              ((Number(form.buyingPrice) - Number(form.sellingPrice)) /
                Number(form.buyingPrice)) * 100
            )}% off)
          </div>
        )}
      </div>

      {/* ── Info banner ── */}
      <div style={{
        background: "#fff7ed", border: "1px solid #fed7aa",
        borderRadius: 12, padding: "12px 16px",
        fontSize: 13, color: "#92400e", marginBottom: 80,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <span>
          Your product will be reviewed by admin before going live on the website.
          You'll see the approval status in <strong>My Products</strong>.
        </span>
      </div>

      {/* ── Sticky submit ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #e8f5e1",
        padding: "12px 16px", zIndex: 100,
        display: "flex", gap: 10, justifyContent: "center",
      }}>
        <button
          onClick={handleReset}
          style={{
            flex: 1, maxWidth: 120,
            background: "#f3f4f6", color: "#374151",
            border: "none", borderRadius: 12,
            padding: "13px", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1, maxWidth: 300,
            background: submitting
              ? "#9ca3af"
              : "linear-gradient(135deg,#2d5a1b,#3a7d1e)",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "13px", fontSize: 14, fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            boxShadow: submitting ? "none" : "0 4px 16px rgba(58,125,30,.3)",
          }}
        >
          {submitting ? (
            <><Loader size={18} style={{ animation: "spin .7s linear infinite" }} /> Submitting…</>
          ) : (
            <><Package size={18} /> Submit for Approval</>
          )}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}