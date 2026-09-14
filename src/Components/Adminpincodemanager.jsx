// AdminPincodeManager.jsx
// ✅ Full Admin Pincode Management — Add, Activate, Deactivate, Delete, Search, Bulk Import
// ✅ 100% Mobile Responsive
// ✅ Matches your existing green (#16a34a) admin theme

import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("adminToken");
const authHdr = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── API helpers ──────────────────────────────────────────────────────────────
const api = {
  list: (params = "") =>
    fetch(`${API_URL}/api/pincode?${params}`, { headers: authHdr() }).then(r => r.json()),
  add: (body) =>
    fetch(`${API_URL}/api/pincode`, {
      method: "POST", headers: authHdr(), body: JSON.stringify(body),
    }).then(r => r.json()),
  update: (id, body) =>
    fetch(`${API_URL}/api/pincode/${id}`, {
      method: "PUT", headers: authHdr(), body: JSON.stringify(body),
    }).then(r => r.json()),
  toggle: (id, isActive) =>
    fetch(`${API_URL}/api/pincode/${id}/toggle`, {
      method: "PATCH", headers: authHdr(), body: JSON.stringify({ isActive }),
    }).then(r => r.json()),
  delete: (id) =>
    fetch(`${API_URL}/api/pincode/${id}`, {
      method: "DELETE", headers: authHdr(),
    }).then(r => r.json()),
  bulkImport: (pincodes) =>
    fetch(`${API_URL}/api/pincode/bulk`, {
      method: "POST", headers: authHdr(), body: JSON.stringify({ pincodes }),
    }).then(r => r.json()),
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, color = "currentColor", fill = "none", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const SearchIc   = () => <Ic d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />;
const PlusIc     = () => <Ic d="M12 5v14M5 12h14" />;
const EditIc     = () => <Ic d={["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]} size={14}/>;
const TrashIc    = () => <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6","M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"]} size={14}/>;
const UploadIc   = () => <Ic d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]} />;
const MapPinIc   = () => <Ic d={["M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z","M12 13a3 3 0 100-6 3 3 0 000 6z"]} />;
const CheckIc    = () => <Ic d="M20 6L9 17l-5-5" />;
const XIc        = () => <Ic d="M18 6L6 18M6 6l12 12" />;
const RefreshIc  = () => <Ic d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />;
const DownloadIc = () => <Ic d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} />;

const Spinner = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
    <path d="M12 2a10 10 0 0110 10" />
  </svg>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const bg = type === "success" ? "#166534" : type === "warning" ? "#92400e" : "#991b1b";
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, background: bg, color: "#fff", padding: "12px 22px",
      borderRadius: 12, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 8,
      maxWidth: "calc(100vw - 32px)", animation: "fadeUp 0.25s ease",
    }}>
      {type === "success" ? <CheckIc /> : <XIc />}
      {message}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "24px 22px",
        maxWidth: 360, width: "100%", animation: "fadeUp 0.2s ease",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <TrashIc />
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#374151", textAlign: "center", lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px 0", border: "1.5px solid #e5e7eb", borderRadius: 10,
            background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "11px 0", border: "none", borderRadius: 10,
            background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function PincodeModal({ initial, onSave, onClose, saving }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    pincode: initial?.pincode || "",
    city: initial?.city || "",
    state: initial?.state || "",
    isActive: initial?.isActive !== undefined ? initial.isActive : true,
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.pincode.trim()) e.pincode = "Pincode required";
    else if (!/^\d{4,10}$/.test(form.pincode.trim())) e.pincode = "Only digits, 4–10 chars";
    if (!form.city.trim()) e.city = "City required";
    if (!form.state.trim()) e.state = "State required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inputStyle = (err) => ({
    width: "100%", padding: "10px 12px", fontSize: 14, color: "#111",
    border: `1.5px solid ${err ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: 10, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", background: "#fff", transition: "border-color 0.15s",
  });

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end",
      justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: 520,
        borderRadius: "20px 20px 0 0", maxHeight: "90vh", overflowY: "auto",
        animation: "slideUp 0.25s ease", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111",
            display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#16a34a" }}><MapPinIc /></span>
            {isEdit ? "Edit Pincode" : "Add New Pincode"}
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
            border: "none", background: "#f3f4f6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XIc />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Pincode */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151",
              marginBottom: 5, display: "block" }}>
              Pincode <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              style={inputStyle(errors.pincode)}
              placeholder="e.g. 800001"
              value={form.pincode}
              onChange={e => set("pincode", e.target.value)}
              disabled={isEdit}
              onFocus={e => e.target.style.borderColor = "#16a34a"}
              onBlur={e => e.target.style.borderColor = errors.pincode ? "#ef4444" : "#e5e7eb"}
            />
            {errors.pincode && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.pincode}</div>}
            {isEdit && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Pincode cannot be changed after creation</div>}
          </div>

          {/* City + State side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151",
                marginBottom: 5, display: "block" }}>
                City <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                style={inputStyle(errors.city)}
                placeholder="Patna"
                value={form.city}
                onChange={e => set("city", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur={e => e.target.style.borderColor = errors.city ? "#ef4444" : "#e5e7eb"}
              />
              {errors.city && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.city}</div>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151",
                marginBottom: 5, display: "block" }}>
                State <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                style={inputStyle(errors.state)}
                placeholder="Bihar"
                value={form.state}
                onChange={e => set("state", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur={e => e.target.style.borderColor = errors.state ? "#ef4444" : "#e5e7eb"}
              />
              {errors.state && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.state}</div>}
            </div>
          </div>

          {/* Status toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f9fafb", borderRadius: 12, padding: "12px 16px" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Delivery Active</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                Orders can be delivered to this pincode
              </div>
            </div>
            <button
              onClick={() => set("isActive", !form.isActive)}
              style={{
                width: 48, height: 26, borderRadius: 13, border: "none",
                background: form.isActive ? "#16a34a" : "#d1d5db",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3,
                left: form.isActive ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px 24px" }}>
          <button
            onClick={() => { if (validate()) onSave(form); }}
            disabled={saving}
            style={{
              width: "100%", padding: "14px 0",
              background: saving ? "#15803d" : "#16a34a",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
          >
            {saving ? <><Spinner size={15} /> Saving…</> : isEdit ? "Update Pincode" : "Add Pincode"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────
function BulkModal({ onSave, onClose, saving }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [parseErr, setParseErr] = useState("");

  const exampleCSV = `pincode,city,state
800001,Patna,Bihar
800002,Patna,Bihar
110001,New Delhi,Delhi`;

  const parseText = (val) => {
    setText(val);
    setParseErr("");
    if (!val.trim()) { setPreview([]); return; }
    const lines = val.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const rows = [];
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && line.toLowerCase().includes("pincode")) continue; // skip header
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 3) { errors.push(`Line ${i + 1}: needs pincode,city,state`); continue; }
      const [pincode, city, state] = parts;
      if (!/^\d{4,10}$/.test(pincode)) { errors.push(`Line ${i + 1}: "${pincode}" is invalid`); continue; }
      rows.push({ pincode, city, state, isActive: true });
    }
    if (errors.length) { setParseErr(errors.slice(0, 3).join(" | ")); }
    setPreview(rows);
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end",
      justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: 560,
        borderRadius: "20px 20px 0 0", maxHeight: "92vh", overflowY: "auto",
        animation: "slideUp 0.25s ease", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111",
            display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#16a34a" }}><UploadIc /></span>
            Bulk Import Pincodes
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
            border: "none", background: "#f3f4f6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XIc />
          </button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Example */}
          <div style={{ background: "#f8faf8", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>CSV Format Example</span>
              <button
                onClick={() => navigator.clipboard.writeText(exampleCSV)}
                style={{ fontSize: 11, color: "#16a34a", background: "none", border: "none",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                Copy
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: 11, color: "#6b7280",
              fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {exampleCSV}
            </pre>
          </div>

          {/* Textarea */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151",
              marginBottom: 5, display: "block" }}>
              Paste CSV data below
            </label>
            <textarea
              rows={7}
              value={text}
              onChange={e => parseText(e.target.value)}
              placeholder="pincode,city,state&#10;800001,Patna,Bihar&#10;800002,Patna,Bihar"
              style={{
                width: "100%", padding: "10px 12px", fontSize: 13, color: "#111",
                border: `1.5px solid ${parseErr ? "#ef4444" : "#e5e7eb"}`,
                borderRadius: 10, fontFamily: "monospace", outline: "none",
                boxSizing: "border-box", resize: "vertical", lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = "#16a34a"}
              onBlur={e => e.target.style.borderColor = parseErr ? "#ef4444" : "#e5e7eb"}
            />
            {parseErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{parseErr}</div>}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>
                ✅ {preview.length} pincodes ready to import
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4,
                maxHeight: 120, overflowY: "auto" }}>
                {preview.map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#374151",
                    display: "flex", gap: 8 }}>
                    <span style={{ fontWeight: 700, minWidth: 70 }}>{p.pincode}</span>
                    <span style={{ color: "#6b7280" }}>{p.city}, {p.state}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "0 20px 24px" }}>
          <button
            onClick={() => preview.length > 0 && onSave(preview)}
            disabled={saving || preview.length === 0}
            style={{
              width: "100%", padding: "14px 0",
              background: preview.length === 0 ? "#9ca3af" : saving ? "#15803d" : "#16a34a",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 800,
              cursor: (saving || preview.length === 0) ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
          >
            {saving
              ? <><Spinner size={15} /> Importing…</>
              : `Import ${preview.length > 0 ? preview.length : ""} Pincodes`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, color }) => (
  <div style={{
    flex: 1, minWidth: 0, background: "#fff", border: `1.5px solid ${color}25`,
    borderRadius: 12, padding: "12px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{label}</div>
    </div>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`,
      display: "flex", alignItems: "center", justifyContent: "center", color }}>
      <MapPinIc />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPincodeManager() {
  const [pincodes, setPincodes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | active | inactive
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const LIMIT = 20;

  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [showBulk, setShowBulk]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [togglingId, setTogglingId]   = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // pincode object
  const [toast, setToast]             = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Fetch ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: LIMIT,
        ...(search ? { search } : {}),
        ...(filterStatus !== "all" ? { isActive: filterStatus === "active" } : {}),
      });
      const data = await api.list(params.toString());
      if (data.success) {
        setPincodes(data.pincodes || []);
        setTotalPages(Math.ceil((data.total || 0) / LIMIT));
        setTotalCount(data.total || 0);
      }
    } catch { showToast("Failed to load pincodes", "error"); }
    finally { setLoading(false); }
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  // ── Add / Edit ───────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const res = editItem?.id
        ? await api.update(editItem.id, form)
        : await api.add(form);
      if (res.success) {
        showToast(editItem?.id ? "Pincode updated!" : "Pincode added!");
        setShowModal(false);
        setEditItem(null);
        load();
      } else {
        showToast(res.message || "Failed to save", "error");
      }
    } catch { showToast("Something went wrong", "error"); }
    finally { setSaving(false); }
  };

  // ── Toggle active/inactive ───────────────────────────────────────────────
  const handleToggle = async (item) => {
    setTogglingId(item.id);
    try {
      const res = await api.toggle(item.id, !item.isActive);
      if (res.success) {
        setPincodes(prev => prev.map(p => p.id === item.id ? { ...p, isActive: !p.isActive } : p));
        showToast(item.isActive ? "Pincode deactivated" : "Pincode activated!");
      } else {
        showToast(res.message || "Failed to update", "error");
      }
    } catch { showToast("Something went wrong", "error"); }
    finally { setTogglingId(null); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      const res = await api.delete(confirmDelete.id);
      if (res.success) {
        showToast("Pincode deleted");
        load();
      } else {
        showToast(res.message || "Failed to delete", "error");
      }
    } catch { showToast("Something went wrong", "error"); }
    finally { setDeletingId(null); }
  };

  // ── Bulk Import ──────────────────────────────────────────────────────────
  const handleBulkImport = async (rows) => {
    setSaving(true);
    try {
      const res = await api.bulkImport(rows);
      if (res.success) {
        showToast(`${res.imported || rows.length} pincodes imported!`);
        setShowBulk(false);
        load();
      } else {
        showToast(res.message || "Import failed", "error");
      }
    } catch { showToast("Import failed", "error"); }
    finally { setSaving(false); }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const activeCount   = pincodes.filter(p => p.isActive).length;
  const inactiveCount = pincodes.filter(p => !p.isActive).length;

  // ── Export CSV ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = "pincode,city,state,isActive";
    const rows = pincodes.map(p => `${p.pincode},${p.city},${p.state},${p.isActive}`);
    const csv = [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "pincodes.csv";
    a.click();
  };

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", minHeight: "100vh",
      background: "#f4f6f4", padding: "clamp(14px, 3vw, 28px)" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .pin-row:hover { background: #f9fafb !important; }
        .pin-row { transition: background 0.12s; }
        .tog-btn { transition: background 0.18s, transform 0.12s; }
        .tog-btn:hover { transform: scale(1.05); }
        input:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); outline: none; }
        @media (max-width: 480px) {
          .stat-row { flex-direction: column !important; }
          .action-row { flex-wrap: wrap !important; }
          .filter-row { flex-wrap: wrap !important; }
          .pin-meta { display: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "#1a2332",
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#16a34a" }}><MapPinIc /></span>
            Delivery Pincodes
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Manage which areas you deliver to
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={exportCSV} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff",
            color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
          }}>
            <DownloadIc /> Export
          </button>
          <button onClick={() => setShowBulk(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            border: "1.5px solid #16a34a", borderRadius: 10, background: "#f0fdf4",
            color: "#16a34a", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
          }}>
            <UploadIc /> Bulk Import
          </button>
          <button onClick={() => { setEditItem(null); setShowModal(true); }} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
            border: "none", borderRadius: 10, background: "#16a34a",
            color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
            fontFamily: "inherit", boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
          }}>
            <PlusIc /> Add Pincode
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stat-row" style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <StatBadge label="Total Pincodes" value={totalCount} color="#3b82f6" />
        <StatBadge label="Active (Delivering)" value={activeCount} color="#16a34a" />
        <StatBadge label="Inactive (Paused)" value={inactiveCount} color="#f59e0b" />
      </div>

      {/* ── Filters + Search ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px",
        marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div className="filter-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <div style={{ position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: "#9ca3af" }}>
              <SearchIc />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pincode, city, state…"
              style={{
                width: "100%", paddingLeft: 38, paddingRight: 12,
                paddingTop: 10, paddingBottom: 10,
                border: "1.5px solid #e5e7eb", borderRadius: 10,
                fontSize: 13, color: "#111", fontFamily: "inherit",
                background: "#f9fafb", outline: "none", transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* Status filter pills */}
          {["all", "active", "inactive"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "8px 14px", borderRadius: 8,
              border: `1.5px solid ${filterStatus === s ? "#16a34a" : "#e5e7eb"}`,
              background: filterStatus === s ? "#f0fdf4" : "#fff",
              color: filterStatus === s ? "#16a34a" : "#6b7280",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
              textTransform: "capitalize",
            }}>
              {s === "all" ? "All" : s === "active" ? "✅ Active" : "⏸ Inactive"}
            </button>
          ))}

          {/* Refresh */}
          <button onClick={load} style={{
            width: 38, height: 38, border: "1.5px solid #e5e7eb", borderRadius: 10,
            background: "#fff", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#6b7280",
            flexShrink: 0,
          }}>
            {loading ? <Spinner size={14} /> : <RefreshIc />}
          </button>
        </div>
      </div>

      {/* ── Table / List ── */}
      <div style={{ background: "#fff", borderRadius: 14,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>

        {/* Table header — desktop */}
        <div style={{ display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 90px 110px",
          gap: 0, padding: "10px 16px",
          background: "#f8faf8", borderBottom: "1.5px solid #f0f0f0",
          fontSize: 11, fontWeight: 800, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.5px" }}
          className="pin-meta">
          <div>Pincode</div>
          <div>City</div>
          <div>State</div>
          <div>Status</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px",
                borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
                <div style={{ flex: 1, height: 13, background: "#f0f0f0", borderRadius: 6,
                  animation: "pulse 1.4s ease-in-out infinite" }} />
                <div style={{ width: 80, height: 13, background: "#f0f0f0", borderRadius: 6,
                  animation: "pulse 1.4s ease-in-out infinite" }} />
                <div style={{ width: 60, height: 24, background: "#f0f0f0", borderRadius: 6,
                  animation: "pulse 1.4s ease-in-out infinite" }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && pincodes.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "#16a34a" }}>
              <MapPinIc />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#111" }}>
              No pincodes found
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>
              {search ? `No results for "${search}"` : "Add your first delivery pincode to get started."}
            </p>
            {!search && (
              <button onClick={() => setShowModal(true)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px",
                background: "#16a34a", color: "#fff", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                <PlusIc /> Add First Pincode
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading && pincodes.map((item) => {
          const isToggling = togglingId === item.id;
          const isDeleting = deletingId === item.id;

          return (
            <div key={item.id} className="pin-row" style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12, padding: "13px 16px",
              borderBottom: "1px solid #f3f4f6",
              alignItems: "center",
            }}>
              {/* Left: info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {/* Pin icon colored by status */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: item.isActive ? "#f0fdf4" : "#f9fafb",
                  border: `1.5px solid ${item.isActive ? "#bbf7d0" : "#e5e7eb"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: item.isActive ? "#16a34a" : "#9ca3af",
                }}>
                  <MapPinIc />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#111",
                      fontFamily: "monospace" }}>
                      {item.pincode}
                    </span>
                    {/* Status badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
                      background: item.isActive ? "#dcfce7" : "#f3f4f6",
                      color: item.isActive ? "#16a34a" : "#9ca3af",
                      border: `1px solid ${item.isActive ? "#bbf7d0" : "#e5e7eb"}`,
                    }}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {item.city}{item.state ? `, ${item.state}` : ""}
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {/* Toggle */}
                <button
                  className="tog-btn"
                  onClick={() => handleToggle(item)}
                  disabled={isToggling}
                  title={item.isActive ? "Deactivate" : "Activate"}
                  style={{
                    width: 44, height: 26, borderRadius: 13, border: "none",
                    background: item.isActive ? "#16a34a" : "#d1d5db",
                    cursor: isToggling ? "not-allowed" : "pointer",
                    position: "relative", flexShrink: 0, opacity: isToggling ? 0.6 : 1,
                  }}
                >
                  {isToggling
                    ? <div style={{ position: "absolute", inset: 0, display: "flex",
                        alignItems: "center", justifyContent: "center" }}>
                        <Spinner size={12} />
                      </div>
                    : <div style={{
                        position: "absolute", top: 3,
                        left: item.isActive ? 21 : 3,
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#fff", transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      }} />
                  }
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setEditItem(item); setShowModal(true); }}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: "1.5px solid #e5e7eb", background: "#fff",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#6b7280", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
                >
                  <EditIc />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(item)}
                  disabled={isDeleting}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: "1.5px solid #fca5a5", background: "#fff",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#ef4444", transition: "all 0.12s",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  {isDeleting ? <Spinner size={12} /> : <TrashIc />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8,
              background: "#fff", color: page === 1 ? "#d1d5db" : "#374151",
              fontSize: 13, fontWeight: 700, cursor: page === 1 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >← Prev</button>

          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 36, height: 36, border: "none", borderRadius: 8,
                  background: page === p ? "#16a34a" : "#fff",
                  color: page === p ? "#fff" : "#374151",
                  border: `1.5px solid ${page === p ? "#16a34a" : "#e5e7eb"}`,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>{p}</button>
              );
            }
            if (Math.abs(p - page) === 2) return <span key={p} style={{ color: "#9ca3af" }}>…</span>;
            return null;
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8,
              background: "#fff", color: page === totalPages ? "#d1d5db" : "#374151",
              fontSize: 13, fontWeight: 700,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >Next →</button>
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <PincodeModal
          initial={editItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          saving={saving}
        />
      )}
      {showBulk && (
        <BulkModal
          onSave={handleBulkImport}
          onClose={() => setShowBulk(false)}
          saving={saving}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete pincode "${confirmDelete.pincode} — ${confirmDelete.city}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}