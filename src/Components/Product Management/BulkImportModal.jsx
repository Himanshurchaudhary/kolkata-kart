import { useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const getToken = () => localStorage.getItem("adminToken");

export default function BulkImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleImport = async () => {
    if (!file) return setError("Please select an Excel file");
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("excelFile", file);
      const res = await fetch(`${API_URL}/api/products/bulk-import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      setResult(data);
      if (data.imported > 0) {
        onSuccess?.();   // list refresh karo, par modal khula rakho taaki result dikhe
      }
      if (data.failed > 0 && data.imported === 0) {
        setError(`Sab ${data.failed} rows fail hui. Neeche reasons dekho.`);
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const downloadTemplate = () => {
  const a = document.createElement("a");
  a.href = "/product_import_template.xlsx";
  a.download = "product_import_template.xlsx";
  a.click();
};
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>📥 Bulk Import Products</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>

        {/* Template download */}
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "#166534", fontWeight: 600, marginBottom: 6 }}>📋 Download Template First</p>
          <p style={{ fontSize: 12, color: "#16a34a", marginBottom: 10 }}>Fill the template with your products. Image URL is optional.</p>
          <button onClick={downloadTemplate} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ⬇ Download CSV Template
          </button>
        </div>

        {/* File upload */}
        <div
          onClick={() => inputRef.current.click()}
          style={{ border: "2px dashed #d1d5db", borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", marginBottom: 16, background: file ? "#f0fdf4" : "#f9fafb" }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>✅ {file.name}</p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Click to change file</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Click to upload Excel / CSV</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>.xlsx, .xls, .csv supported</p>
            </div>
          )}
        </div>

        {/* Required columns info */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>Required columns:</strong> name, sku, category_id, sellingPrice<br />
          <strong>Optional:</strong> buyingPrice, stockQuantity, unit, thumbnail (image URL), description
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>❌ {error}</p>}

        {result && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>✅ Import Complete!</p>
            <p style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>
              {result.imported} imported successfully, {result.failed} failed
            </p>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 120, overflowY: "auto" }}>
                {result.errors.map((e, i) => (
                  <p key={i} style={{ fontSize: 11, color: "#dc2626" }}>Row {e.row}: {e.reason}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b7280", background: "#fff" }}>
            Cancel
          </button>
          <button onClick={handleImport} disabled={loading || !file} style={{ flex: 2, padding: "10px 0", background: loading ? "#16a34a99" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Importing…" : "🚀 Start Import"}
          </button>
        </div>
      </div>
    </div>
  );
}