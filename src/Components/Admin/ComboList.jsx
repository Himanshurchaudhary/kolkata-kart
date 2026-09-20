import { useState, useEffect, useCallback } from "react";

const API_BASEA = import.meta.env.VITE_API_URL;
const API_BASE  = `${API_BASEA}/api/combos`;
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

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{ animation: "toastIn 0.2s ease-out" }}
            className={`fixed bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-sm
                z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white
                ${toast.type === "error" ? "bg-red-500" : "bg-violet-500"}`}>
            <span>{toast.msg}</span>
        </div>
    );
}

/* ── Delete Confirm Modal ───────────────────────────────────── */
function DeleteModal({ combo, onConfirm, onCancel, loading }) {
    if (!combo) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <div className="text-center">
                    <h3 className="text-base font-bold text-gray-900">Delete Combo?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        "<span className="font-semibold text-gray-700">{combo.name}</span>" permanently delete ho jayega.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        )}
                        {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
    const active = status === "active";
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
            ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

/* ── Combo Card ─────────────────────────────────────────────── */
function ComboCard({ combo, onEdit, onDelete, onToggleStatus, toggling }) {
    const savings = (parseFloat(combo.totalMrp) - parseFloat(combo.comboPrice)) || 0;
    const savePct = combo.totalMrp > 0
        ? Math.round(((combo.totalMrp - combo.comboPrice) / combo.totalMrp) * 100)
        : 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Top: thumbnail + info */}
            <div className="flex gap-3 p-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    {combo.thumbnail ? (
                        <img src={combo.thumbnail} alt={combo.name}
                            className="h-full w-full object-cover"
                            onError={e => { e.target.src = "https://placehold.co/80x80?text=🎁"; }} />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl">🎁</div>
                    )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{combo.name}</h3>
                        <StatusBadge status={combo.status} />
                    </div>

                    {combo.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{combo.description}</p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-base font-black text-violet-600">৳{parseFloat(combo.comboPrice).toFixed(2)}</span>
                        {combo.totalMrp > 0 && (
                            <span className="text-xs text-gray-400 line-through">৳{parseFloat(combo.totalMrp).toFixed(2)}</span>
                        )}
                        {savePct > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                                -{savePct}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Products strip */}
            {combo.products?.length > 0 && (
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {combo.products.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-1 flex-shrink-0">
                                <div className="h-8 w-8 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                                    <img src={p.thumbnail} alt={p.name}
                                        className="h-full w-full object-cover"
                                        onError={e => { e.target.src = "https://placehold.co/32x32?text=?"; }} />
                                </div>
                                {p.quantity > 1 && (
                                    <span className="text-[10px] font-bold text-violet-500">×{p.quantity}</span>
                                )}
                                {i < combo.products.length - 1 && (
                                    <span className="text-gray-300 text-xs font-bold">+</span>
                                )}
                            </div>
                        ))}
                        <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">
                            {combo.products.length} item{combo.products.length > 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            )}

            {/* Dates if set */}
            {(combo.startDate || combo.endDate) && (
                <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {combo.startDate?.slice(0, 10) || "—"} → {combo.endDate?.slice(0, 10) || "No end"}
                </div>
            )}

            {/* Stock */}
            <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Stock: <span className={`font-semibold ${combo.stockQuantity < 10 ? "text-red-500" : "text-gray-600"}`}>
                    {combo.stockQuantity}
                </span>
            </div>

            {/* Action buttons */}
            <div className="border-t border-gray-50 px-4 py-3 flex items-center gap-2">
                {/* Toggle status */}
                <button onClick={() => onToggleStatus(combo)} disabled={toggling === combo.id}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors
                        ${combo.status === "active"
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                    {toggling === combo.id ? (
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 8v4l3 3" />
                        </svg>
                    )}
                    {combo.status === "active" ? "Deactivate" : "Activate"}
                </button>

                <div className="flex-1" />

                {/* Edit */}
                <button onClick={() => onEdit(combo)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                        bg-violet-50 text-violet-600 hover:bg-violet-100 active:bg-violet-200 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                </button>

                {/* Delete */}
                <button onClick={() => onDelete(combo)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                        bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    );
}

/* ── Empty State ────────────────────────────────────────────── */
function EmptyState({ search, onAdd }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
                {search ? "Koi combo nahi mila" : "Abhi koi combo nahi hai"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
                {search
                    ? `"${search}" ke liye koi result nahi`
                    : "Pehla combo offer banao aur sales badhao!"}
            </p>
            {!search && (
                <button onClick={onAdd}
                    className="flex items-center gap-2 px-5 py-3 bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-violet-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Combo Banao
                </button>
            )}
        </div>
    );
}

/* ── Skeleton Loader ────────────────────────────────────────── */
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="flex gap-3">
                <div className="h-20 w-20 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="h-5 bg-gray-100 rounded-lg w-1/3" />
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <div className="h-6 w-6 rounded-lg bg-gray-100" />
                <div className="h-6 w-6 rounded-lg bg-gray-100" />
                <div className="h-6 w-6 rounded-lg bg-gray-100" />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
                <div className="h-8 flex-1 bg-gray-100 rounded-xl" />
                <div className="h-8 w-16 bg-gray-100 rounded-xl" />
                <div className="h-8 w-16 bg-gray-100 rounded-xl" />
            </div>
        </div>
    );
}

/* ── Stats Bar ──────────────────────────────────────────────── */
function StatsBar({ combos }) {
    const active   = combos.filter(c => c.status === "active").length;
    const inactive = combos.filter(c => c.status === "inactive").length;
    const total    = combos.length;

    return (
        <div className="grid grid-cols-3 gap-3">
            {[
                { label: "Total",    value: total,    color: "bg-violet-50 text-violet-700", dot: "bg-violet-400" },
                { label: "Active",   value: active,   color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
                { label: "Inactive", value: inactive, color: "bg-gray-50 text-gray-600", dot: "bg-gray-400" },
            ].map(({ label, value, color, dot }) => (
                <div key={label} className={`${color} rounded-2xl p-3 text-center`}>
                    <p className="text-xl font-black">{value}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <p className="text-[10px] font-semibold opacity-80">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── MAIN PAGE ──────────────────────────────────────────────── */
// NOTE: Pass onAddNew and onEdit props from your router/parent
// onAddNew() → open AddComboPage (create mode)
// onEdit(combo) → open AddComboPage (edit mode, pass existingCombo=combo)
export default function ComboListPage({ onAddNew, onEdit }) {
    const [combos,       setCombos]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [page,         setPage]         = useState(1);
    const [totalPages,   setTotalPages]   = useState(1);
    const [totalCombos,  setTotalCombos]  = useState(0);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);
    const [toggling,     setToggling]     = useState(null);
    const [toast,        setToast]        = useState(null);
    const LIMIT = 10;

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    const fetchCombos = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit: LIMIT, showAll: "true",
                ...(search       ? { search }              : {}),
                ...(filterStatus !== "all" ? { status: filterStatus } : {}),
            });
            const data = await apiFetch(`${API_BASE}/all?${params}`);
            setCombos(data.combos || []);
            setTotalPages(data.totalPages || 1);
            setTotalCombos(data.totalCombos || 0);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus]);

    useEffect(() => { fetchCombos(); }, [fetchCombos]);

    // Search debounce — reset to page 1
    useEffect(() => { setPage(1); }, [search, filterStatus]);

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await apiFetch(`${API_BASE}/delete/${deleteTarget.id}`, { method: "DELETE" });
            showToast("Combo deleted!");
            setDeleteTarget(null);
            fetchCombos();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setDeleting(false);
        }
    }

    async function handleToggleStatus(combo) {
        setToggling(combo.id);
        try {
            const fd = new FormData();
            fd.append("status", combo.status === "active" ? "inactive" : "active");
            await apiFetch(`${API_BASE}/update/${combo.id}`, { method: "PUT", body: fd });
            showToast(`Combo ${combo.status === "active" ? "deactivated" : "activated"}!`);
            fetchCombos();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setToggling(null);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif] pb-10">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                .no-scrollbar::-webkit-scrollbar { display:none; }
                .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
                .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
                .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
            `}</style>

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎁</span>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900">Combo Offers</h1>
                            <p className="text-[10px] text-gray-400">{totalCombos} total combos</p>
                        </div>
                    </div>
                    <button onClick={onAddNew}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 hover:bg-violet-600
                            text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-violet-200">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Combo
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* Stats */}
                {!loading && combos.length > 0 && <StatsBar combos={combos} />}

                {/* Search + Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search combo…"
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                                focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400 transition"
                        />
                        {search && (
                            <button onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
                                ×
                            </button>
                        )}
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                            focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700 transition">
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : combos.length === 0 ? (
                    <EmptyState search={search} onAdd={onAddNew} />
                ) : (
                    <div className="space-y-4">
                        {combos.map(combo => (
                            <ComboCard
                                key={combo.id}
                                combo={combo}
                                onEdit={onEdit}
                                onDelete={setDeleteTarget}
                                onToggleStatus={handleToggleStatus}
                                toggling={toggling}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200
                                text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce((acc, p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === "…" ? (
                                    <span key={`dots-${i}`} className="text-gray-400 text-sm px-1">…</span>
                                ) : (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`h-9 w-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors
                                            ${p === page
                                                ? "bg-violet-500 text-white shadow-sm"
                                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                        {p}
                                    </button>
                                )
                            )}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200
                                text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </main>

            {/* Delete modal */}
            <DeleteModal
                combo={deleteTarget}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />

            <Toast toast={toast} />
        </div>
    );
}