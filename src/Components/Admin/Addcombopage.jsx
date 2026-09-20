import { useState, useEffect, useRef } from "react";

const API_BASEA = import.meta.env.VITE_API_URL;
const API_BASE  = `${API_BASEA}/api/combos`;
const PROD_BASE = `${API_BASEA}/api/products`;
const getToken  = () => localStorage.getItem("adminToken") || "";

async function apiFetch(url, options = {}) {
    const res  = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

/* ── Primitive UI ──────────────────────────────────────────── */
function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );
}
function Input({ className = "", ...props }) {
    return (
        <input className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
            placeholder-gray-400 transition ${className}`} {...props} />
    );
}
function Textarea({ className = "", ...props }) {
    return (
        <textarea className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
            placeholder-gray-400 transition resize-y ${className}`} {...props} />
    );
}
function Select({ className = "", children, ...props }) {
    return (
        <select className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
            text-gray-700 transition ${className}`} {...props}>
            {children}
        </select>
    );
}
function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}
function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{ animation: "toastIn 0.2s ease-out" }}
            className={`fixed bottom-20 left-4 right-4 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2
                sm:w-auto sm:max-w-sm z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl
                shadow-xl text-sm font-semibold text-white
                ${toast.type === "error" ? "bg-red-500" : "bg-violet-500"}`}>
            <span>{toast.msg}</span>
        </div>
    );
}
function SectionCard({ title, icon, children, defaultOpen = true, badge }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 bg-gray-50/50 text-left">
                <div className="flex items-center gap-2.5">
                    {icon && <span className="text-violet-500">{icon}</span>}
                    <span className="text-sm font-bold text-gray-800">{title}</span>
                    {badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="p-4 sm:p-5">{children}</div>}
        </div>
    );
}

/* ── Thumbnail Dropzone ────────────────────────────────────── */
function ThumbnailDropzone({ onChange, existingUrl = "" }) {
    const [preview, setPreview] = useState(existingUrl);
    const inputRef = useRef();

    useEffect(() => { if (existingUrl) setPreview(existingUrl); }, [existingUrl]);

    function handleFile(file) {
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        onChange(file);
    }

    return (
        <div>
            <Label>Combo Thumbnail</Label>
            <div
                onClick={() => inputRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                className="cursor-pointer"
            >
                {preview ? (
                    <div className="relative h-36 w-full rounded-xl overflow-hidden border border-gray-200">
                        <img src={preview} alt="" className="h-full w-full object-cover" />
                        <button type="button"
                            onClick={e => { e.stopPropagation(); setPreview(""); onChange(null); }}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center shadow">
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="h-36 w-full border-2 border-dashed border-gray-200 rounded-xl
                        flex flex-col items-center justify-center text-gray-300
                        hover:border-violet-400 hover:text-violet-400 transition-colors bg-gray-50">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                        </svg>
                        <span className="text-xs mt-1 text-gray-400">Upload combo image</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
        </div>
    );
}

/* ── Product Search & Picker ───────────────────────────────── */
function ProductSearchPicker({ selectedProducts, onChange }) {
    const [query, setQuery]       = useState("");
    const [results, setResults]   = useState([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await apiFetch(
                    `${PROD_BASE}/all?search=${encodeURIComponent(query)}&showAll=true&limit=10`
                );
                const already = selectedProducts.map(p => p.product_id);
                setResults((data.products || []).filter(p => !already.includes(p.id)));
            } catch { setResults([]); }
            finally { setSearching(false); }
        }, 400);
    }, [query, selectedProducts]);

    function addProduct(p) {
        onChange([...selectedProducts, { product_id: p.id, quantity: 1, _data: p }]);
        setQuery(""); setResults([]);
    }

    function removeProduct(productId) {
        onChange(selectedProducts.filter(p => p.product_id !== productId));
    }

    function updateQty(productId, qty) {
        onChange(selectedProducts.map(p =>
            p.product_id === productId ? { ...p, quantity: Math.max(1, Number(qty)) } : p
        ));
    }

    return (
        <div className="space-y-3">
            {/* Search box */}
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search product by name or SKU…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                        focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400 transition"
                />
                {searching && (
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-violet-400"
                        fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                )}
            </div>

            {/* Search results dropdown */}
            {results.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
                    {results.map(p => (
                        <button key={p.id} type="button" onClick={() => addProduct(p)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-50 active:bg-violet-100 transition-colors text-left">
                            <img src={p.thumbnail} alt=""
                                className="h-10 w-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                onError={e => { e.target.src = "https://placehold.co/40x40?text=?"; }} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                                <p className="text-xs text-gray-400">SKU: {p.sku} · ৳{p.sellingPrice}</p>
                            </div>
                            <span className="text-violet-500 text-lg font-bold flex-shrink-0">+</span>
                        </button>
                    ))}
                </div>
            )}

            {query && !searching && results.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-2">No products found</p>
            )}

            {/* Selected products list */}
            {selectedProducts.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm">
                    Search and add products to this combo
                </div>
            ) : (
                <div className="space-y-2">
                    {selectedProducts.map((item, idx) => {
                        const p = item._data || {};
                        return (
                            <div key={item.product_id}
                                className="flex items-center gap-3 p-3 bg-violet-50/40 border border-violet-100 rounded-xl">
                                <span className="text-xs font-bold text-violet-400 w-5 text-center flex-shrink-0">
                                    {idx + 1}
                                </span>
                                <img src={p.thumbnail} alt=""
                                    className="h-10 w-10 rounded-lg object-cover border border-white shadow-sm flex-shrink-0"
                                    onError={e => { e.target.src = "https://placehold.co/40x40?text=?"; }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name || `Product #${item.product_id}`}</p>
                                    <p className="text-xs text-gray-400">৳{p.sellingPrice ?? "—"}</p>
                                </div>
                                {/* Qty control */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button type="button"
                                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                                        className="h-7 w-7 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center hover:bg-gray-100 transition">−</button>
                                    <span className="text-sm font-bold text-gray-700 w-6 text-center">{item.quantity}</span>
                                    <button type="button"
                                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                                        className="h-7 w-7 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center hover:bg-gray-100 transition">+</button>
                                </div>
                                <button type="button" onClick={() => removeProduct(item.product_id)}
                                    className="h-7 w-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 font-bold text-sm flex items-center justify-center flex-shrink-0">×</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── MAIN COMPONENT ────────────────────────────────────────── */
export default function AddComboPage({ existingCombo = null, onSaved, onCancel }) {
    const isEditMode = Boolean(existingCombo);

    const [name,           setName]           = useState("");
    const [description,    setDescription]    = useState("");
    const [comboPrice,     setComboPrice]      = useState("");
    const [totalMrp,       setTotalMrp]        = useState("");
    const [discountLabel,  setDiscountLabel]   = useState("");
    const [status,         setStatus]          = useState("active");
    const [startDate,      setStartDate]       = useState("");
    const [endDate,        setEndDate]         = useState("");
    const [stockQuantity,  setStockQuantity]   = useState("");
    const [thumbnail,      setThumbnail]       = useState(null);
    const [existingThumb,  setExistingThumb]   = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [submitting,     setSubmitting]      = useState(false);
    const [toast,          setToast]           = useState(null);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // Populate on edit
    useEffect(() => {
        if (!existingCombo) return;
        const c = existingCombo;
        setName(c.name || "");
        setDescription(c.description || "");
        setComboPrice(c.comboPrice ?? "");
        setTotalMrp(c.totalMrp ?? "");
        setDiscountLabel(c.discountLabel || "");
        setStatus(c.status || "active");
        setStartDate(c.startDate?.slice(0, 10) || "");
        setEndDate(c.endDate?.slice(0, 10) || "");
        setStockQuantity(c.stockQuantity ?? "");
        setExistingThumb(c.thumbnail || "");
        if (Array.isArray(c.products)) {
            setSelectedProducts(c.products.map(p => ({
                product_id: p.id,
                quantity:   p.quantity || 1,
                _data:      p,
            })));
        }
    }, [existingCombo]);

    // Auto-calc totalMrp from selected products
    useEffect(() => {
        const total = selectedProducts.reduce((sum, item) => {
            const price = parseFloat(item._data?.sellingPrice || 0);
            return sum + price * item.quantity;
        }, 0);
        if (total > 0) setTotalMrp(total.toFixed(2));
    }, [selectedProducts]);

    // Auto-calc discount label
    useEffect(() => {
        const mrp   = parseFloat(totalMrp);
        const combo = parseFloat(comboPrice);
        if (!isNaN(mrp) && !isNaN(combo) && mrp > combo && mrp > 0) {
            const pct = Math.round(((mrp - combo) / mrp) * 100);
            setDiscountLabel(`Save ${pct}%`);
        }
    }, [totalMrp, comboPrice]);

    async function handleSubmit(e) {
        e?.preventDefault();
        if (!name.trim())        return showToast("Combo name is required", "error");
        if (!comboPrice)         return showToast("Combo price is required", "error");
        if (!selectedProducts.length) return showToast("Add at least one product", "error");

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name",          name);
            fd.append("description",   description);
            fd.append("comboPrice",    comboPrice);
            fd.append("totalMrp",      totalMrp || 0);
            fd.append("discountLabel", discountLabel);
            fd.append("status",        status);
            fd.append("startDate",     startDate);
            fd.append("endDate",       endDate);
            fd.append("stockQuantity", stockQuantity || 0);
            fd.append("products", JSON.stringify(
                selectedProducts.map(({ product_id, quantity }) => ({ product_id, quantity }))
            ));
            if (thumbnail) fd.append("thumbnail", thumbnail);

            if (isEditMode) {
                await apiFetch(`${API_BASE}/update/${existingCombo.id}`, { method: "PUT", body: fd });
            } else {
                await apiFetch(`${API_BASE}/add`, { method: "POST", body: fd });
            }

            if (onSaved) onSaved();
            else showToast(isEditMode ? "Combo updated!" : "Combo created!");
            if (!isEditMode) handleReset();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        setName(""); setDescription(""); setComboPrice(""); setTotalMrp("");
        setDiscountLabel(""); setStatus("active"); setStartDate(""); setEndDate("");
        setStockQuantity(""); setThumbnail(null); setSelectedProducts([]);
    }

    const savings = (parseFloat(totalMrp) - parseFloat(comboPrice)) || 0;

    return (
        <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif] pb-36">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {onCancel && (
                            <button type="button" onClick={onCancel}
                                className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-sm font-bold text-gray-900">
                                {isEditMode ? "Edit Combo Offer" : "Create Combo Offer"}
                            </h1>
                            {isEditMode && (
                                <p className="text-[10px] text-violet-600 font-semibold truncate">✏ {existingCombo?.name}</p>
                            )}
                        </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full">
                        🎁 Bundle Deal
                    </span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* Basic Info */}
                <SectionCard title="Combo Info" defaultOpen icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }>
                    <div className="space-y-4">
                        <div>
                            <Label required>Combo Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g. Family Grocery Pack, Weekend Snack Bundle" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={description} onChange={e => setDescription(e.target.value)}
                                rows={3} placeholder="Brief description of this combo…" />
                        </div>
                        <ThumbnailDropzone onChange={setThumbnail} existingUrl={existingThumb} />
                    </div>
                </SectionCard>

                {/* Products */}
                <SectionCard
                    title="Bundle Products"
                    badge={selectedProducts.length > 0 ? `${selectedProducts.length}` : undefined}
                    defaultOpen
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    }
                >
                    <ProductSearchPicker
                        selectedProducts={selectedProducts}
                        onChange={setSelectedProducts}
                    />
                </SectionCard>

                {/* Pricing */}
                <SectionCard title="Pricing" defaultOpen icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Total MRP (auto)</Label>
                                <Input type="number" value={totalMrp}
                                    onChange={e => setTotalMrp(e.target.value)}
                                    placeholder="0.00" min="0" step="0.01"
                                    className="bg-gray-50 text-gray-500" readOnly />
                            </div>
                            <div>
                                <Label required>Combo Price</Label>
                                <Input type="number" value={comboPrice}
                                    onChange={e => setComboPrice(e.target.value)}
                                    placeholder="0.00" min="0" step="0.01" />
                            </div>
                        </div>

                        {savings > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                <span className="text-lg">🎉</span>
                                <div>
                                    <p className="text-xs font-bold text-green-700">
                                        Customer saves ৳{savings.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-green-600">{discountLabel}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Discount Label</Label>
                            <Input value={discountLabel}
                                onChange={e => setDiscountLabel(e.target.value)}
                                placeholder="e.g. Save 20%, Best Value (auto-filled)" />
                        </div>
                        <div>
                            <Label>Stock Quantity</Label>
                            <Input type="number" value={stockQuantity}
                                onChange={e => setStockQuantity(e.target.value)}
                                placeholder="0" min="0" className="max-w-[160px]" />
                        </div>
                    </div>
                </SectionCard>

                {/* Validity & Status */}
                <SectionCard title="Validity & Status" defaultOpen={false} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                }>
                    <div className="space-y-4">
                        <div>
                            <Label>Status</Label>
                            <Select value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Start Date</Label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-4 text-white shadow-md shadow-violet-200">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">Combo Summary</p>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                        {[
                            { label: "Combo Name",  value: name || "—" },
                            { label: "Products",    value: selectedProducts.length > 0 ? `${selectedProducts.length} items` : "—" },
                            { label: "Total MRP",   value: totalMrp ? `৳${totalMrp}` : "—" },
                            { label: "Combo Price", value: comboPrice ? `৳${comboPrice}` : "—" },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[10px] opacity-60">{label}</p>
                                <p className="font-semibold truncate">{value}</p>
                            </div>
                        ))}
                        {savings > 0 && (
                            <div className="col-span-2 pt-2 mt-1 border-t border-white/20">
                                <p className="text-[10px] opacity-60">Customer Saves</p>
                                <p className="font-bold text-yellow-300 text-base">৳{savings.toFixed(2)} · {discountLabel}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 flex bg-white border-t border-gray-100 px-4 py-3 gap-3 shadow-lg"
                style={{ zIndex: 9999 }}>
                <button type="button"
                    onClick={isEditMode && onCancel ? onCancel : handleReset}
                    className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    {isEditMode ? "Cancel" : "Reset"}
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 text-sm font-bold
                        bg-violet-500 hover:bg-violet-600 active:bg-violet-700 disabled:opacity-60
                        text-white rounded-xl transition-colors shadow-md shadow-violet-200">
                    {submitting && <Spinner />}
                    {submitting ? "Saving…" : isEditMode ? "Update Combo" : "Save Combo"}
                </button>
            </div>

            <Toast toast={toast} />
        </div>
    );
}