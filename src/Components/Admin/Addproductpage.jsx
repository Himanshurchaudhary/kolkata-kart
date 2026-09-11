import { useState, useEffect, useRef } from "react";

const API_BASEA = import.meta.env.VITE_API_URL;
const API_BASE = `${API_BASEA}/api/products`;
const getToken = () => localStorage.getItem("adminToken") || "";

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

// ─── Primitive UI helpers ──────────────────────────────────────
function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );
}

function Input({ className = "", ...props }) {
    return (
        <input
            className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
        placeholder-gray-400 transition ${className}`}
            {...props}
        />
    );
}

function Textarea({ className = "", ...props }) {
    return (
        <textarea
            className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
        placeholder-gray-400 transition resize-y ${className}`}
            {...props}
        />
    );
}

function Select({ className = "", children, ...props }) {
    return (
        <select
            className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
        text-gray-700 transition ${className}`}
            {...props}
        >
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
        <div
            style={{ animation: "toastIn 0.2s ease-out" }}
            className={`fixed bottom-20 left-4 right-4 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-sm
        z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white
        ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
        >
            {toast.type === "error" ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            )}
            <span>{toast.msg}</span>
        </div>
    );
}

// ─── Collapsible Section Card ─────────────────────────────────
function SectionCard({ title, icon, children, defaultOpen = true, badge }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 bg-gray-50/50 text-left"
            >
                <div className="flex items-center gap-2.5">
                    {icon && <span className="text-emerald-500">{icon}</span>}
                    <span className="text-sm font-bold text-gray-800">{title}</span>
                    {badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="p-4 sm:p-5">{children}</div>}
        </div>
    );
}

// ─── Rich Editor (simplified, mobile-friendly) ────────────────
function RichEditor({ value, onChange }) {
    const editorRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (editorRef.current && value && !initializedRef.current) {
            editorRef.current.innerHTML = value;
            initializedRef.current = true;
        }
    }, [value]);

    function execCmd(cmd) {
        editorRef.current?.focus();
        document.execCommand(cmd, false, null);
        onChange(editorRef.current?.innerHTML || "");
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-400 transition">
            {/* Toolbar — scrollable on mobile */}
            <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {[
                    { label: "B", cmd: "bold", className: "font-black" },
                    { label: "I", cmd: "italic", className: "italic" },
                    { label: "U", cmd: "underline", className: "underline" },
                    { label: "S", cmd: "strikeThrough", className: "line-through" },
                ].map((btn) => (
                    <button
                        key={btn.cmd}
                        type="button"
                        onClick={() => execCmd(btn.cmd)}
                        className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors ${btn.className}`}
                    >
                        {btn.label}
                    </button>
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />
                {["≡ UL", "1≡ OL"].map((b) => (
                    <button key={b} type="button"
                        className="h-8 px-2 flex-shrink-0 flex items-center justify-center rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition-colors">
                        {b}
                    </button>
                ))}
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                className="min-h-[120px] px-4 py-3 text-sm text-gray-700 focus:outline-none"
                data-placeholder="Enter product description…"
                style={{ lineHeight: "1.7" }}
            />
        </div>
    );
}

// ─── Image Drop Zone ──────────────────────────────────────────
function ImageDropzone({ label, hint, multiple = false, onChange, maxFiles = 1, existingUrls = [] }) {
    const [previews, setPreviews] = useState(existingUrls);
    const inputRef = useRef();

    useEffect(() => {
        if (existingUrls.length > 0) setPreviews(existingUrls);
    }, [existingUrls.join(",")]);

    function handleFiles(files) {
        const arr = Array.from(files).slice(0, maxFiles);
        const urls = arr.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        onChange(multiple ? arr : arr[0]);
    }

    function handleDrop(e) {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }

    return (
        <div>
            <Label>
                {label}
                {hint && <span className="text-blue-500 font-normal ml-1">({hint})</span>}
                <span className="text-red-500 ml-1">*</span>
            </Label>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current.click()}
                className="flex flex-wrap gap-2 cursor-pointer"
            >
                {previews.length === 0 ? (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors bg-gray-50 active:scale-95">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                        </svg>
                        <span className="text-[10px] mt-1 text-gray-400">Upload</span>
                    </div>
                ) : (
                    previews.map((url, i) => (
                        <div key={i} className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const next = previews.filter((_, j) => j !== i);
                                    setPreviews(next);
                                    if (!multiple) onChange(null);
                                }}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow"
                            >×</button>
                        </div>
                    ))
                )}
                {multiple && previews.length < maxFiles && previews.length > 0 && (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center text-emerald-400 text-2xl hover:bg-emerald-50 transition-colors">+</div>
                )}
                <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
        </div>
    );
}

// ─── Tag Input ────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
    const [input, setInput] = useState("");

    function addTag(e) {
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
            setInput("");
        }
    }

    return (
        <div className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-emerald-400 transition">
            {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                    {t}
                    <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-emerald-400 hover:text-emerald-600 text-sm leading-none">×</button>
                </span>
            ))}
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={tags.length === 0 ? "Type keyword & press Enter" : "+add"}
                className="flex-1 min-w-[100px] text-sm focus:outline-none placeholder-gray-400 bg-transparent"
            />
        </div>
    );
}

// ─── Variants Section ─────────────────────────────────────────
const EMPTY_VARIANT = () => ({
    _id: Math.random().toString(36).slice(2),
    label: "",
    sku: String(Math.floor(100000 + Math.random() * 900000)),
    buyingPrice: "",
    sellingPrice: "",
    discountPrice: "",
    stockQuantity: "",
    minOrderQuantity: "1",
    isDefault: false,
});

function VariantCard({ v, idx, total, onUpdate, onRemove, onSetDefault, onGenerateSku }) {
    const [open, setOpen] = useState(true);

    function handlePrice(field, value) {
        const updated = { ...v, [field]: value };
        const buying = parseFloat(field === "buyingPrice" ? value : v.buyingPrice);
        const selling = parseFloat(field === "sellingPrice" ? value : v.sellingPrice);
        updated.discountPrice = (!isNaN(buying) && !isNaN(selling) && buying > selling)
            ? (buying - selling).toFixed(2) : "";
        onUpdate(updated);
    }

    return (
        <div className={`rounded-2xl border ${v.isDefault ? "border-emerald-300 bg-emerald-50/20" : "border-gray-200 bg-white"}`}>
            {/* Variant header — tappable */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setOpen((o) => !o)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${v.isDefault ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {v.isDefault ? "★ Default" : `#${idx + 1}`}
                    </span>
                    {v.label && (
                        <span className="text-xs font-semibold text-gray-700 truncate">{v.label}</span>
                    )}
                    {!v.label && (
                        <span className="text-xs text-gray-400 italic">Untitled variant</span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 text-sm font-bold"
                    >×</button>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {open && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                    {/* Label */}
                    <div className="pt-3">
                        <Label required>Variant Label</Label>
                        <Input value={v.label} onChange={(e) => onUpdate({ ...v, label: e.target.value })}
                            placeholder="e.g. 500ml, 1kg, Large" />
                    </div>

                    {/* SKU */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <Label required>SKU</Label>
                            <button type="button" onClick={onGenerateSku}
                                className="text-[10px] font-semibold text-emerald-600 hover:underline">
                                Auto-generate
                            </button>
                        </div>
                        <Input value={v.sku} onChange={(e) => onUpdate({ ...v, sku: e.target.value })} placeholder="SKU" />
                    </div>

                    {/* Prices — 2 col on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label required>Old Price (MRP)</Label>
                            <Input type="number" value={v.buyingPrice}
                                onChange={(e) => handlePrice("buyingPrice", e.target.value)}
                                placeholder="0.00" min="0" step="0.01" />
                        </div>
                        <div>
                            <Label required>New Price</Label>
                            <Input type="number" value={v.sellingPrice}
                                onChange={(e) => handlePrice("sellingPrice", e.target.value)}
                                placeholder="0.00" min="0" step="0.01" />
                        </div>
                        <div>
                            <Label>Discount</Label>
                            <Input type="number" value={v.discountPrice}
                                onChange={(e) => onUpdate({ ...v, discountPrice: e.target.value })}
                                placeholder="auto" min="0" step="0.01" />
                        </div>
                        <div>
                            <Label required>Stock Qty</Label>
                            <Input type="number" value={v.stockQuantity}
                                onChange={(e) => onUpdate({ ...v, stockQuantity: e.target.value })}
                                placeholder="0" min="0" />
                        </div>
                    </div>

                    <div>
                        <Label>Min Order Qty</Label>
                        <Input type="number" value={v.minOrderQuantity}
                            onChange={(e) => onUpdate({ ...v, minOrderQuantity: e.target.value })}
                            placeholder="1" min="1" className="max-w-[120px]" />
                    </div>

                    {!v.isDefault && (
                        <button type="button" onClick={onSetDefault}
                            className="text-xs font-semibold text-emerald-600 hover:underline">
                            ★ Set as default variant
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function VariantsSection({ variants, onChange }) {
    function addVariant() {
        const v = EMPTY_VARIANT();
        const next = [...variants, v];
        if (next.length === 1) next[0].isDefault = true;
        onChange(next);
    }

    function removeVariant(idx) {
        const next = variants.filter((_, i) => i !== idx);
        if (!next.some((v) => v.isDefault) && next.length > 0) next[0].isDefault = true;
        onChange(next);
    }

    function updateVariant(idx, updated) {
        onChange(variants.map((v, i) => (i === idx ? updated : v)));
    }

    function setDefault(idx) {
        onChange(variants.map((v, i) => ({ ...v, isDefault: i === idx })));
    }

    function generateSku(idx) {
        updateVariant(idx, { ...variants[idx], sku: String(Math.floor(100000 + Math.random() * 900000)) });
    }

    return (
        <SectionCard
            title="Product Variants"
            badge={variants.length > 0 ? `${variants.length}` : undefined}
            defaultOpen={false}
            icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            }
        >
            <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Add size/weight/pack options — e.g. <strong>500ml</strong>, <strong>1kg</strong>. Leave empty to use base price.</span>
                </div>

                {variants.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                        No variants yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {variants.map((v, idx) => (
                            <VariantCard
                                key={v._id}
                                v={v}
                                idx={idx}
                                total={variants.length}
                                onUpdate={(updated) => updateVariant(idx, updated)}
                                onRemove={() => removeVariant(idx)}
                                onSetDefault={() => setDefault(idx)}
                                onGenerateSku={() => generateSku(idx)}
                            />
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={addVariant}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-sm font-semibold text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Variant
                </button>
            </div>
        </SectionCard>
    );
}

// ─── Category Picker — modal on mobile ───────────────────────
function CategoryPicker({ categories, selected, onChange, loading }) {
    const [open, setOpen] = useState(false);

    const selectedNames = selected
        .map((id) => categories.find((c) => c.id === id)?.name)
        .filter(Boolean);

    function toggle(id) {
        onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);
    }

    return (
        <>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-left hover:border-emerald-400 transition"
            >
                <span className={selected.length === 0 ? "text-gray-400" : "text-gray-700 font-medium"}>
                    {selected.length === 0 ? "Choose categories…" : selectedNames.join(", ")}
                </span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Modal/Drawer */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl max-h-[70vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-800">Select Categories</h3>
                            <button type="button" onClick={() => setOpen(false)}
                                className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold">×</button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-1 flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                                    <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Loading…
                                </div>
                            ) : (
                                categories.map((cat) => (
                                    <label key={cat.id}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                        <input type="checkbox" checked={selected.includes(cat.id)}
                                            onChange={() => toggle(cat.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-500 accent-emerald-500" />
                                        <span className="text-sm text-gray-700">{cat.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100">
                            <button type="button" onClick={() => setOpen(false)}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors">
                                Done ({selected.length} selected)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Helper ───────────────────────────────────────────────────
function resolveId(field) {
    if (!field) return "";
    if (typeof field === "object" && field.id) return field.id;
    return field;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function AddProductPage({ existingProduct = null, onSaved, onCancel }) {
    const isEditMode = Boolean(existingProduct);

    // Form state
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [shortDesc, setShortDesc] = useState("");
    const [description, setDescription] = useState("");
    const [brand, setBrand] = useState("");
    const [unit, setUnit] = useState("");
    const [sku, setSku] = useState(String(Math.floor(100000 + Math.random() * 900000)));
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [buyingPrice, setBuyingPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("0");
    const [stockQty, setStockQty] = useState("");
    const [minOrderQty, setMinOrderQty] = useState("1");
    const [thumbnail, setThumbnail] = useState(null);
    const [existingThumbnail, setExistingThumbnail] = useState("");
    const [additionalImages, setAdditionalImages] = useState([]);
    const [existingAdditional, setExistingAdditional] = useState([]);
    const [videoType, setVideoType] = useState("Upload Video File");
    const [videoFile, setVideoFile] = useState(null);
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDesc, setMetaDesc] = useState("");
    const [metaKeywords, setMetaKeywords] = useState([]);
    const [variants, setVariants] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [attributes, setAttributes] = useState([]);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // Pre-fill edit mode
    useEffect(() => {
        if (!existingProduct) return;
        const p = existingProduct;
        setName(p.name || ""); setSlug(p.slug || ""); setShortDesc(p.shortDescription || "");
        setDescription(p.description || ""); setBrand(resolveId(p.brand)); setUnit(p.unit || "");
        setSku(p.sku || "");
        const catId = resolveId(p.category);
        setSelectedCategories(catId ? [catId] : []);
        setBuyingPrice(p.buyingPrice ?? ""); setSellingPrice(p.sellingPrice ?? p.price ?? "");
        setDiscountPrice(p.discountPrice ?? "0"); setStockQty(p.stockQuantity ?? "");
        setMinOrderQty(p.minOrderQuantity ?? "1"); setExistingThumbnail(p.thumbnail || "");
        setExistingAdditional(p.additionalImages || []); setMetaTitle(p.metaTitle || "");
        setMetaDesc(p.metaDescription || "");
        setMetaKeywords(Array.isArray(p.metaKeywords) ? p.metaKeywords : typeof p.metaKeywords === "string" ? JSON.parse(p.metaKeywords || "[]") : []);
        setAttributes(Array.isArray(p.attributes) ? p.attributes : []);
        if (Array.isArray(p.variants) && p.variants.length > 0) {
            setVariants(p.variants.map(v => ({ ...v, _id: v.id || Math.random().toString(36).slice(2) })));
        }
    }, [existingProduct]);

    // Auto-slug
    useEffect(() => {
        if (!isEditMode) {
            setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
        }
    }, [name, isEditMode]);

    // Auto-discount
    useEffect(() => {
        const b = parseFloat(buyingPrice), s = parseFloat(sellingPrice);
        setDiscountPrice(!isNaN(b) && !isNaN(s) && b > s ? (b - s).toFixed(2) : "");
    }, [buyingPrice, sellingPrice]);

    useEffect(() => {
        apiFetch("/brand/all").then((d) => setBrands(d.brands || [])).catch(() => { });
    }, []);

    useEffect(() => {
        fetch(`${API_BASEA}/api/Category/all`, { headers: { Authorization: `Bearer ${getToken()}` } })
            .then((r) => r.json())
            .then((d) => setCategories(d.categories || d.data || d || []))
            .catch(() => { })
            .finally(() => setCategoriesLoading(false));
    }, []);

    function generateSku() { setSku(String(Math.floor(100000 + Math.random() * 900000))); }

    function handleAttributeChange(key, value) {
        setAttributes(prev => {
            const existing = prev.find(a => a.key === key);
            if (existing) return prev.map(a => a.key === key ? { key, value } : a);
            return [...prev, { key, value }];
        });
    }

    function validateVariants() {
        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            if (!v.label.trim()) return `Variant ${i + 1}: Label required`;
            if (!v.sku.trim()) return `Variant ${i + 1}: SKU required`;
            if (!v.buyingPrice) return `Variant ${i + 1}: Old Price required`;
            if (!v.sellingPrice) return `Variant ${i + 1}: New Price required`;
            if (!v.stockQuantity && v.stockQuantity !== 0) return `Variant ${i + 1}: Stock Qty required`;
        }
        const skus = variants.map(v => v.sku.trim());
        if (new Set(skus).size !== skus.length) return "Duplicate SKUs in variants";
        return null;
    }

    async function handleSubmit(e) {
        e?.preventDefault();
        if (!isEditMode && !thumbnail) return showToast("Thumbnail image is required", "error");
        if (selectedCategories.length === 0) return showToast("Please select at least one category", "error");
        const variantError = validateVariants();
        if (variantError) return showToast(variantError, "error");

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", name); fd.append("slug", slug);
            fd.append("shortDescription", shortDesc); fd.append("description", description);
            fd.append("brand", brand); fd.append("unit", unit); fd.append("sku", sku);
            fd.append("category", selectedCategories[0]);
            fd.append("buyingPrice", buyingPrice); fd.append("sellingPrice", sellingPrice);
            fd.append("discountPrice", discountPrice || 0);
            fd.append("stockQuantity", stockQty); fd.append("minOrderQuantity", minOrderQty);
            fd.append("metaTitle", metaTitle); fd.append("metaDescription", metaDesc);
            fd.append("metaKeywords", JSON.stringify(metaKeywords));
            fd.append("attributes", JSON.stringify(attributes));
            fd.append("variants", JSON.stringify(variants.map(({ _id, ...v }) => v)));
            if (thumbnail) fd.append("thumbnail", thumbnail);
            additionalImages.forEach((img) => fd.append("additionalImages", img));
            if (videoFile) { fd.append("videoType", "Upload"); fd.append("video", videoFile); }

            if (isEditMode) {
                await apiFetch(`/update/${existingProduct.id}`, { method: "PUT", body: fd });
            } else {
                await apiFetch("/add", { method: "POST", body: fd });
            }

            if (onSaved) onSaved();
            else showToast(isEditMode ? "Product updated!" : "Product added successfully!");
            if (!isEditMode) handleReset();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        if (isEditMode && existingProduct) {
            const p = existingProduct;
            setName(p.name || ""); setSlug(p.slug || ""); setShortDesc(p.shortDescription || "");
            setDescription(p.description || ""); setBrand(resolveId(p.brand)); setUnit(p.unit || "");
            setSku(p.sku || ""); setBuyingPrice(p.buyingPrice ?? ""); setSellingPrice(p.sellingPrice ?? "");
            setDiscountPrice(p.discountPrice ?? "0"); setStockQty(p.stockQuantity ?? "");
            setMinOrderQty(p.minOrderQuantity ?? "1"); setMetaTitle(p.metaTitle || "");
            setMetaDesc(p.metaDescription || ""); setThumbnail(null); setAdditionalImages([]);
            setVariants(Array.isArray(p.variants) ? p.variants.map(v => ({ ...v, _id: v.id || Math.random().toString(36).slice(2) })) : []);
            return;
        }
        setName(""); setSlug(""); setShortDesc(""); setDescription("");
        setBrand(""); setUnit(""); setSku(String(Math.floor(100000 + Math.random() * 900000)));
        setSelectedCategories([]); setBuyingPrice(""); setSellingPrice(""); setDiscountPrice("0");
        setStockQty(""); setMinOrderQty("1"); setThumbnail(null); setAdditionalImages([]);
        setVideoFile(null); setMetaTitle(""); setMetaDesc(""); setMetaKeywords([]);
        setAttributes([]); setVariants([]);
    }

    return (
        <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif] pb-24 sm:pb-8">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        [contenteditable]:empty:before { content:attr(data-placeholder); color:#9ca3af; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

            {/* ── Sticky Header ── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {onCancel && (
                            <button type="button" onClick={onCancel}
                                className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-gray-900 truncate">
                                {isEditMode ? "Edit Product" : "Add New Product"}
                            </h1>
                            {isEditMode && (
                                <p className="text-[10px] text-blue-600 font-semibold truncate">
                                    ✏ {existingProduct?.name}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Desktop buttons */}
                    <div className="hidden sm:flex gap-2 flex-shrink-0">
                        <button type="button" onClick={isEditMode && onCancel ? onCancel : handleReset}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            {isEditMode ? "Cancel" : "Reset"}
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm shadow-emerald-200">
                            {submitting && <Spinner />}
                            {submitting ? "Saving…" : isEditMode ? "Update" : "Save Product"}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* Product Info */}
                <SectionCard title="Product Info" defaultOpen={true} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }>
                    <div className="space-y-4">
                        <div>
                            <Label required>Product Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Enter product name" required />
                        </div>
                        <div>
                            <Label>Permalink / Slug</Label>
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-400 transition">
                                <span className="flex items-center px-3 text-[10px] text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                                    /products/
                                </span>
                                <input value={slug} onChange={(e) => setSlug(e.target.value)}
                                    placeholder="auto-generated"
                                    className="flex-1 px-3 py-2.5 text-sm bg-white focus:outline-none placeholder-gray-400" />
                            </div>
                        </div>
                        <div>
                            <Label required>Short Description</Label>
                            <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)}
                                rows={3} placeholder="Brief product summary" required />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Label required>Description</Label>
                                <button type="button"
                                    className="flex items-center gap-1 text-[10px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded-lg transition-colors">
                                    ✨ AI Generate
                                </button>
                            </div>
                            <RichEditor value={description} onChange={setDescription} />
                        </div>
                    </div>
                </SectionCard>

                {/* General Info */}
                <SectionCard title="General Info" defaultOpen={true} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Brand</Label>
                                <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
                                    <option value="">Select brand</option>
                                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label required>Unit</Label>
                                <Input value={unit} onChange={(e) => setUnit(e.target.value)}
                                    placeholder="kg / pc / packet" required />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label required>Product SKU</Label>
                                <button type="button" onClick={generateSku}
                                    className="text-[10px] font-semibold text-emerald-600 hover:underline">
                                    Auto-generate
                                </button>
                            </div>
                            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" required />
                        </div>
                        <div>
                            <Label required>Category</Label>
                            <CategoryPicker categories={categories} selected={selectedCategories}
                                onChange={setSelectedCategories} loading={categoriesLoading} />
                        </div>
                        {/* Category attributes */}
                        {selectedCategories.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <p className="text-xs font-semibold text-gray-500">
                                    Attributes — <span className="text-gray-700">{categories.find(c => c.id === selectedCategories[0])?.name}</span>
                                </p>
                                {["Size", "Weight", "Color"].map((attr) => (
                                    <div key={attr}>
                                        <Label>{attr}</Label>
                                        <Input placeholder={`Enter ${attr}`}
                                            value={attributes.find(a => a.key === attr)?.value || ""}
                                            onChange={(e) => handleAttributeChange(attr, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Pricing */}
                <SectionCard title="Pricing & Stock" defaultOpen={true} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }>
                    {variants.length > 0 && (
                        <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Variants added — base price used as fallback.
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label required>Old Price (MRP)</Label>
                            <Input type="number" value={buyingPrice}
                                onChange={(e) => setBuyingPrice(e.target.value)}
                                placeholder="0.00" min="0" step="0.01" required />
                        </div>
                        <div>
                            <Label required>Selling Price</Label>
                            <Input type="number" value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                                placeholder="0.00" min="0" step="0.01" required />
                        </div>
                        <div>
                            <Label>Discount</Label>
                            <Input type="number" value={discountPrice}
                                onChange={(e) => setDiscountPrice(e.target.value)}
                                placeholder="auto" min="0" step="0.01" />
                        </div>
                        <div>
                            <Label required>Stock Qty</Label>
                            <Input type="number" value={stockQty}
                                onChange={(e) => setStockQty(e.target.value)}
                                placeholder="0" min="0" required />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <Label>Min Order Qty</Label>
                            <Input type="number" value={minOrderQty}
                                onChange={(e) => setMinOrderQty(e.target.value)}
                                placeholder="1" min="1" />
                        </div>
                    </div>
                </SectionCard>

                {/* Variants */}
                <VariantsSection variants={variants} onChange={setVariants} />

                {/* Images */}
                <SectionCard title="Images & Video" defaultOpen={true} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                }>
                    <div className="space-y-5">
                        {isEditMode && existingThumbnail && !thumbnail && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-600">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Existing thumbnail kept unless you upload a new one.
                            </div>
                        )}
                        <ImageDropzone label="Thumbnail" hint="1280×960 px"
                            onChange={setThumbnail}
                            existingUrls={existingThumbnail ? [existingThumbnail] : []} />
                        <ImageDropzone label="Additional Images" hint="up to 5"
                            multiple maxFiles={5}
                            onChange={setAdditionalImages}
                            existingUrls={existingAdditional} />

                        {/* Video */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Video Source</Label>
                                <Select value={videoType} onChange={(e) => setVideoType(e.target.value)}>
                                    <option>Upload Video File</option>
                                    <option>YouTube</option>
                                    <option>Vimeo</option>
                                    <option>Dailymotion</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Video</Label>
                                {videoType === "Upload Video File" ? (
                                    <input type="file" accept="video/mp4,video/avi,video/mov,video/wmv"
                                        onChange={(e) => setVideoFile(e.target.files[0])}
                                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-xl" />
                                ) : (
                                    <Input placeholder={`${videoType} URL`} />
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* SEO */}
                <SectionCard title="SEO" defaultOpen={false} icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                }>
                    <div className="space-y-4">
                        <div>
                            <Label>Meta Title</Label>
                            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Meta Title" />
                        </div>
                        <div>
                            <Label>Meta Description</Label>
                            <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} placeholder="Meta Description" />
                        </div>
                        <div>
                            <Label>Keywords</Label>
                            <TagInput tags={metaKeywords} onChange={setMetaKeywords} />
                            <p className="text-xs text-gray-400 mt-1">Type a keyword and press Enter to add</p>
                        </div>
                    </div>
                </SectionCard>

                {/* Product Summary Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md shadow-emerald-200">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">Summary</p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        {[
                            { label: "Name", value: name || "—" },
                            { label: "SKU", value: sku },
                            { label: "Price", value: sellingPrice ? `৳${sellingPrice}` : "—" },
                            { label: "Stock", value: stockQty || "—" },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[10px] opacity-60">{label}</p>
                                <p className="font-semibold text-sm truncate">{value}</p>
                            </div>
                        ))}
                        {variants.length > 0 && (
                            <div className="col-span-2 pt-2 mt-1 border-t border-white/20">
                                <p className="text-[10px] opacity-60">Variants</p>
                                <p className="font-semibold text-yellow-200">{variants.length} added</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop footer buttons */}
                <div className="hidden sm:flex justify-end gap-3 pb-4">
                    <button type="button" onClick={isEditMode && onCancel ? onCancel : handleReset}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        {isEditMode ? "Cancel" : "Reset"}
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm shadow-emerald-200">
                        {submitting && <Spinner />}
                        {submitting ? "Saving…" : isEditMode ? "Update Product" : "Save Product"}
                    </button>
                </div>
            </main>

            {/* ── Mobile Bottom Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex gap-3 shadow-lg z-30">
                <button type="button" onClick={isEditMode && onCancel ? onCancel : handleReset}
                    className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    {isEditMode ? "Cancel" : "Reset"}
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="flex-2 flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white rounded-xl transition-colors shadow-md shadow-emerald-200">
                    {submitting && <Spinner />}
                    {submitting ? "Saving…" : isEditMode ? "Update" : "Save Product"}
                </button>
            </div>

            <Toast toast={toast} />
        </div>
    );
}