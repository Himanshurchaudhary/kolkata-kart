import { useState, useEffect, useRef } from "react";
const API_BASEA = import.meta.env.VITE_API_URL;

const BASE_URL = `${API_BASEA}/api/flash`;
const PRODUCTS_API = `${API_BASEA}/api/products/all`;

const getToken = () => localStorage.getItem("adminToken") || "";
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

function formatDateTime(date, time) {
  if (!date) return "—";
  const d = new Date(date);
  const dateStr = d.toISOString().split("T")[0];
  return `${dateStr}${time ? ` · ${time}` : ""}`;
}

const isVideoUrl = (url) => /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url || "");

// ─── Icons ────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

// ─── Shared styles ────────────────────────────────────────────
const inp =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition bg-white";
const lbl = "block text-sm font-medium text-gray-700 mb-1.5";
const Req = () => <span className="text-red-500 ml-0.5">*</span>;

// ─── Spinner ──────────────────────────────────────────────────
const Spinner = ({ sm }) => (
  <div
    className={`${sm ? "w-4 h-4 border-2" : "w-8 h-8 border-4"} animate-spin border-green-400 border-t-transparent rounded-full`}
  />
);

// ─── Page Header ─────────────────────────────────────────────
function PageHeader({ title, subtitle, onBack, action }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition"
            >
              <BackIcon />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 flex-shrink-0"><BoltIcon /></span>
              <h1 className="text-sm font-bold text-gray-900 truncate">{title}</h1>
            </div>
            {subtitle && <p className="text-[10px] text-gray-400 truncate">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  );
}

// ─── Alert ───────────────────────────────────────────────────
function Alert({ msg, onDismiss }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
      <span className="flex-shrink-0">⚠️</span>
      <span className="flex-1">{msg}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 text-red-400 hover:text-red-600 text-xs underline">
          dismiss
        </button>
      )}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Reusable Media Upload Box (image OR video) ────────────────
function MediaUploadBox({ label, hint, preview, file, existingIsVideo, inputRef, onChange, onDrop, onRemove, heightClass = "h-40 sm:h-52" }) {
  const showingVideo = file ? file.type.startsWith("video/") : existingIsVideo;

  return (
    <div>
      <p className={lbl}>
        {label}{" "}
        {hint && <span className="text-blue-500 font-normal text-xs">{hint}</span>}{" "}
        <Req />
      </p>
      <div
        onClick={() => inputRef.current.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`w-full ${heightClass} border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-green-400 hover:bg-green-50 active:bg-green-100 transition flex items-center justify-center bg-gray-50 group relative`}
      >
        {preview ? (
          showingVideo ? (
            <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center text-gray-400 group-hover:text-green-500 transition text-xs gap-1">
            <span className="text-3xl">🖼</span>
            <span>Tap or drag to upload image/video</span>
          </div>
        )}
        {preview && showingVideo && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            VIDEO
          </span>
        )}
      </div>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 text-xs text-red-500 hover:underline w-full text-center"
        >
          Remove
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,video/*" onChange={onChange} className="hidden" />
    </div>
  );
}

// =============================================================================
// EDIT FLASH SALE
// =============================================================================
function EditFlashSale({ sale, onBack, onUpdated }) {
  const [form, setForm] = useState({
    name: sale.name || "",
    minDiscount: sale.minDiscount || "",
    startDate: sale.startDate ? new Date(sale.startDate).toISOString().split("T")[0] : "",
    startTime: sale.startTime || "",
    endDate: sale.endDate ? new Date(sale.endDate).toISOString().split("T")[0] : "",
    endTime: sale.endTime || "",
    description: sale.description || "",
  });

  // Desktop media
  const [desktopFile, setDesktopFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(sale.desktopMedia || null);
  const desktopExistingIsVideo = sale.desktopMediaType === "video";
  const desktopInputRef = useRef(null);

  // Mobile media
  const [mobileFile, setMobileFile] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(sale.mobileMedia || null);
  const mobileExistingIsVideo = sale.mobileMediaType === "video";
  const mobileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMediaChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!okType) { setError("Please select a valid image or video file."); return; }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleMediaDrop = (e, setFile, setPreview) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!okType) { setError("Please drop a valid image or video file."); return; }
    setFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeDesktopMedia = () => {
    setDesktopFile(null);
    setDesktopPreview(null);
    if (desktopInputRef.current) desktopInputRef.current.value = "";
  };

  const removeMobileMedia = () => {
    setMobileFile(null);
    setMobilePreview(null);
    if (mobileInputRef.current) mobileInputRef.current.value = "";
  };

  const validate = () => {
    const { name, minDiscount, startDate, startTime, endDate, endTime, description } = form;
    if (!name.trim()) return "Name is required.";
    if (!minDiscount || isNaN(minDiscount)) return "Valid discount required.";
    if (!startDate || !startTime || !endDate || !endTime) return "All date/time fields required.";
    if (new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`))
      return "End must be after Start.";
    if (!description.trim()) return "Description is required.";
    if (!desktopPreview) return "Desktop Banner is required.";
    if (!mobilePreview) return "Mobile Banner is required.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // sirf jo naya file select hua hai wahi bhejo — baaki backend purana rakhega
      if (desktopFile) fd.append("desktopMedia", desktopFile);
      if (mobileFile) fd.append("mobileMedia", mobileFile);

      const res = await fetch(`${BASE_URL}/update/${sale.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      onUpdated(data.sale);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">
      <PageHeader
        title="Edit Flash Sale"
        subtitle={sale.name}
        onBack={onBack}
        action={
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-60"
          >
            {loading ? <><Spinner sm /> Updating…</> : "Update"}
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {error && <Alert msg={error} onDismiss={() => setError("")} />}

        {/* Desktop & Mobile Banners */}
        <Card className="p-4 space-y-5">
          <MediaUploadBox
            label="Desktop Banner"
            hint="1600 × 550 px — image or video"
            preview={desktopPreview}
            file={desktopFile}
            existingIsVideo={desktopExistingIsVideo}
            inputRef={desktopInputRef}
            onChange={(e) => handleMediaChange(e, setDesktopFile, setDesktopPreview)}
            onDrop={(e) => handleMediaDrop(e, setDesktopFile, setDesktopPreview)}
            onRemove={removeDesktopMedia}
          />
          <MediaUploadBox
            label="Mobile Banner"
            hint="600 × 400 px — image or video"
            preview={mobilePreview}
            file={mobileFile}
            existingIsVideo={mobileExistingIsVideo}
            inputRef={mobileInputRef}
            onChange={(e) => handleMediaChange(e, setMobileFile, setMobilePreview)}
            onDrop={(e) => handleMediaDrop(e, setMobileFile, setMobilePreview)}
            onRemove={removeMobileMedia}
          />
        </Card>

        {/* Fields */}
        <Card className="p-4 space-y-4">
          <div>
            <label className={lbl}>Name <Req /></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Sale name" className={inp} />
          </div>
          <div>
            <label className={lbl}>Minimum Discount (%) <Req /></label>
            <input name="minDiscount" type="number" value={form.minDiscount} onChange={handleChange} placeholder="e.g. 20" className={inp} />
          </div>

          {/* Dates — 2 col */}
          <div>
            <p className={lbl}>Start <Req /></p>
            <div className="grid grid-cols-2 gap-3">
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className={inp} />
              <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className={inp} />
            </div>
          </div>
          <div>
            <p className={lbl}>End <Req /></p>
            <div className="grid grid-cols-2 gap-3">
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inp} />
              <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Description <Req /></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={`${inp} resize-y`} />
          </div>
        </Card>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex gap-3 shadow-lg z-30">
        <button onClick={onBack} disabled={loading}
          className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl transition disabled:opacity-60">
          {loading ? <><Spinner sm /> Updating…</> : "Update"}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// UPDATE PRODUCT MODAL
// =============================================================================
function UpdateProductModal({ saleId, product, onClose, onUpdated }) {
  const [price, setPrice] = useState(product.sellingPrice ?? product.price);
  const [quantity, setQuantity] = useState(product.stockQuantity ?? product.stock ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (price === "" || quantity === "") { setError("Both fields are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/${saleId}/update-product/${product.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(price), quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      onUpdated(data.product);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-800">Update Product</span>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
            <XIcon />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-0.5">Product</p>
            <p className="text-sm font-semibold text-gray-800">{product.name}</p>
          </div>
          {error && <Alert msg={error} />}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price <Req /></label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity <Req /></label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inp} />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition">
            Cancel
          </button>
          <button onClick={handleUpdate} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Spinner sm /> Saving…</> : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FLASH SALE DETAIL
// =============================================================================
function FlashSaleDetail({ saleId, onBack }) {
  const [sale, setSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [addingProduct, setAddingProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [error, setError] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);

  const fetchSale = async () => {
    try {
      const res = await fetch(`${BASE_URL}/${saleId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load sale");
      setSale(data.sale);
      setProducts(Array.isArray(data.sale.products) ? data.sale.products : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch(PRODUCTS_API, { headers: authHeaders() });
      const data = await res.json();
      const raw = data.products ?? data.data ?? data;
      setAllProducts(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setAllProducts([]);
    }
  };

  useEffect(() => {
    fetchSale();
    fetchAllProducts();
  }, [saleId]);

  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    setAddingProduct(true);
    try {
      const res = await fetch(`${BASE_URL}/${saleId}/add-product`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add product");
      setProducts(Array.isArray(data.sale.products) ? data.sale.products : []);
      setSelectedProductId("");
      setShowProductPicker(false);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm("Remove this product from the flash sale?")) return;
    try {
      const res = await fetch(`${BASE_URL}/${saleId}/remove-product/${productId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setProducts(Array.isArray(data.sale.products) ? data.sale.products : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) => prev.map((p) => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
    setEditProduct(null);
  };

  const addedIds = new Set(products.map((p) => String(p.id)));
  const availableProducts = allProducts.filter((p) => !addedIds.has(String(p.id)));

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-red-500 px-4">
        <p className="text-center">{error || "Flash Sale not found"}</p>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">
      <PageHeader
        title={sale.name}
        subtitle="Flash Sale Details"
        onBack={onBack}
        action={
          <button
            onClick={() => setShowProductPicker(true)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <PlusIcon /> Add Product
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {error && <Alert msg={error} onDismiss={() => setError("")} />}

        {/* Sale Info */}
        <Card>
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Deal Info</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sale.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {sale.isActive ? "● Active" : "○ Inactive"}
              </span>
            </div>
          </div>

          {/* Desktop / Mobile media previews */}
          <div className="px-4 pt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Desktop Banner</p>
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                {sale.desktopMedia ? (
                  sale.desktopMediaType === "video" ? (
                    <video src={sale.desktopMedia} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img src={sale.desktopMedia} alt="Desktop banner" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🖼</div>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Mobile Banner</p>
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                {sale.mobileMedia ? (
                  sale.mobileMediaType === "video" ? (
                    <video src={sale.mobileMedia} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img src={sale.mobileMedia} alt="Mobile banner" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🖼</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Min Discount", value: `${sale.minDiscount}%` },
              { label: "Start", value: formatDateTime(sale.startDate, sale.startTime) },
              { label: "End", value: formatDateTime(sale.endDate, sale.endTime) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Products */}
        <Card>
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">
              Products <span className="text-gray-400 font-normal">({products.length})</span>
            </h3>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No products added yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {products.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Thumbnail */}
                  {product.thumbnail || product.image ? (
                    <img src={product.thumbnail || product.image} alt={product.name}
                      className="w-12 h-12 flex-shrink-0 object-cover rounded-xl border border-gray-100" />
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-lg">🖼</div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-green-600 font-bold">
                        ৳{Number(product.sellingPrice ?? product.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400">
                        Stock: {product.stockQuantity ?? product.stock ?? 0}
                      </span>
                      {(product.sold > 0) && (
                        <span className="text-xs text-gray-400">Sold: {product.sold}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setEditProduct(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 active:bg-green-200 transition">
                      <EditIcon />
                    </button>
                    <button onClick={() => handleRemoveProduct(product.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 transition">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Mobile: Add Product FAB */}
      <button
        onClick={() => setShowProductPicker(true)}
        className="sm:hidden fixed bottom-6 right-4 h-14 w-14 flex items-center justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full shadow-lg shadow-green-200 z-20 transition"
      >
        <PlusIcon />
      </button>

      {/* Add Product Drawer/Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowProductPicker(false)} />
          <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl">
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">Add Product to Sale</span>
              <button onClick={() => setShowProductPicker(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <XIcon />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className={lbl}>Select Product <Req /></label>
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={inp}>
                  <option value="">Choose a product…</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.price != null ? ` — ৳${p.price}` : ""}
                    </option>
                  ))}
                </select>
                {availableProducts.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">All products already added.</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowProductPicker(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!selectedProductId || addingProduct}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-600 active:bg-green-700 text-white transition disabled:opacity-50"
              >
                {addingProduct ? <><Spinner sm /> Adding…</> : <><PlusIcon /> Add</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {editProduct && (
        <UpdateProductModal
          saleId={saleId}
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
}

// =============================================================================
// FLASH SALE LIST
// =============================================================================
function FlashSaleList({ onView, onEdit }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/all`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales(Array.isArray(data.sales) ? data.sales : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  const handleToggle = async (sale) => {
    try {
      const res = await fetch(`${BASE_URL}/toggle/${sale.id}`, { method: "PATCH", headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, isActive: data.sale.isActive } : s));
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this flash sale? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE_URL}/delete/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <PageHeader title="Flash Sales" />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {error && <Alert msg={error} />}

        {loading ? (
          <div className="py-20 flex justify-center"><Spinner /></div>
        ) : sales.length === 0 ? (
          <Card className="py-20 text-center text-gray-400 text-sm">
            No flash sales yet. Create one!
          </Card>
        ) : (
          sales.map((sale, i) => (
            <Card key={sale.id}>
              <div className="p-4 flex gap-3">
                {/* Thumbnail — desktopMedia use, image ya video dono handle */}
                <div className="flex-shrink-0">
                  {sale.desktopMedia ? (
                    sale.desktopMediaType === "video" || isVideoUrl(sale.desktopMedia) ? (
                      <video
                        src={sale.desktopMedia}
                        className="w-16 h-16 sm:w-20 sm:h-16 object-cover rounded-xl border border-gray-100"
                        autoPlay muted loop playsInline
                      />
                    ) : (
                      <img src={sale.desktopMedia} alt={sale.name}
                        className="w-16 h-16 sm:w-20 sm:h-16 object-cover rounded-xl border border-gray-100" />
                    )
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-2xl">🖼</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-800 truncate">{sale.name}</p>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(sale)}
                      className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${sale.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sale.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      <span className="font-medium text-gray-600">Start:</span> {formatDateTime(sale.startDate, sale.startTime)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      <span className="font-medium text-gray-600">End:</span> {formatDateTime(sale.endDate, sale.endTime)}
                    </p>
                    {sale.description && (
                      <p className="text-xs text-gray-400 truncate mt-1">{sale.description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => onView(sale.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 active:bg-green-200 text-xs font-semibold transition">
                      <EyeIcon /> View
                    </button>
                    <button onClick={() => onEdit(sale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200 text-xs font-semibold transition">
                      <EditIcon /> Edit
                    </button>
                    <button onClick={() => handleDelete(sale.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 text-xs font-semibold transition">
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ROOT — in-app router
// =============================================================================
export default function FlashSaleApp() {
  const [page, setPage] = useState("list");
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const goList = () => { setPage("list"); setSelectedSaleId(null); setSelectedSale(null); };

  if (page === "view") {
    return <FlashSaleDetail saleId={selectedSaleId} onBack={goList} />;
  }

  if (page === "edit") {
    return <EditFlashSale sale={selectedSale} onBack={goList} onUpdated={goList} />;
  }

  return (
    <FlashSaleList
      onView={(id) => { setSelectedSaleId(id); setPage("view"); }}
      onEdit={(sale) => { setSelectedSale(sale); setPage("edit"); }}
    />
  );
}