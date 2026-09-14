import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("adminToken") || "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export default function CategoryPage() {
  const [activeTab, setActiveTab] = useState("view");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [editId, setEditId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: "true",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/Category/all`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        showToast(data.message || "Failed to load categories", "error");
      }
    } catch (err) {
      showToast("Cannot reach server. Is it running?", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setForm({ name: "", description: "", isActive: "true" });
    setUploadedFile(null);
    setUploadPreview(null);
    setEditId(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleEdit(cat) {
    setForm({
      name: cat.name,
      description: cat.description || "",
      isActive: cat.isActive ? "true" : "false",
    });
    setUploadPreview(cat.thumbnail || null);
    setUploadedFile(null);
    setEditId(cat.id);
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      showToast("Category name is required", "error");
      return;
    }
    if (!editId && !uploadedFile) {
      showToast("Please upload a thumbnail image", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("isActive", form.isActive);
      if (uploadedFile) formData.append("thumbnail", uploadedFile);

      const url = editId
        ? `${API_BASE}/api/Category/${editId}`
        : `${API_BASE}/api/Category/add`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        showToast(
          editId
            ? `"${form.name}" updated successfully!`
            : `"${form.name}" created successfully!`
        );
        resetForm();
        await fetchCategories();
        setActiveTab("view");
      } else {
        showToast(data.message || "Something went wrong", "error");
      }
    } catch (err) {
      showToast("Network error. Check your server.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/Category/${cat.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${cat.name}" deleted`);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      } else {
        showToast(data.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error during delete", "error");
    }
  }

  async function handleToggleStatus(cat) {
    try {
      const formData = new FormData();
      formData.append("name", cat.name);
      formData.append("isActive", !cat.isActive);
      formData.append("description", cat.description || "");

      const res = await fetch(`${API_BASE}/api/Category/${cat.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id ? { ...c, isActive: !cat.isActive } : c
          )
        );
        showToast(`"${cat.name}" marked as ${!cat.isActive ? "active" : "inactive"}`);
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  }

  const filtered = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? c.isActive
        : !c.isActive;
    return matchSearch && matchStatus;
  });

  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }

        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        @media (min-width: 480px) {
          .cat-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
        @media (min-width: 768px) {
          .cat-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 1rem;
        }
        @media (min-width: 480px) {
          .stats-row { gap: 12px; margin-bottom: 1.5rem; }
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 600px) {
          .form-grid { grid-template-columns: 1fr 1fr; }
          .form-full { grid-column: 1 / -1; }
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 1rem;
        }
        @media (min-width: 600px) {
          .search-row { flex-direction: row; align-items: center; }
        }

        .filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cat-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 0.15s, transform 0.15s;
          animation: fadeUp 0.2s ease;
        }
        .cat-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #1a7a4a;
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          min-height: 42px;
        }
        .btn-primary:active { opacity: 0.85; }

        .btn-ghost {
          padding: 9px 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background: #fff;
          color: #555;
          font-family: inherit;
          min-height: 42px;
          white-space: nowrap;
        }

        .tab-bar {
          display: flex;
          gap: 0;
          margin-bottom: 1rem;
          background: #fff;
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 4px;
          width: 100%;
        }
        @media (min-width: 400px) {
          .tab-bar { width: fit-content; }
        }

        .tab-btn {
          flex: 1;
          padding: 9px 16px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #888;
          font-family: inherit;
          white-space: nowrap;
          text-align: center;
        }
        @media (min-width: 400px) {
          .tab-btn { flex: unset; font-size: 14px; padding: 8px 20px; }
        }
        .tab-btn.active { background: #1a7a4a; color: #fff; }

        .icon-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eee;
          border-radius: 7px;
          cursor: pointer;
          background: #fff;
          font-size: 14px;
          flex-shrink: 0;
        }
        .icon-btn-danger { color: #a32d2d; border-color: #fde8e8; background: #fff5f5; }

        .toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%) translateY(0);
          background: #1a7a4a;
          color: #fff;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          white-space: nowrap;
          transition: all 0.3s;
        }
        @media (min-width: 600px) {
          .toast { bottom: 24px; left: auto; right: 24px; transform: translateX(0); }
        }
        .toast.error { background: #a32d2d; }
        .toast.hidden { opacity: 0; transform: translateX(-50%) translateY(20px); }
        @media (min-width: 600px) {
          .toast.hidden { transform: translateX(0) translateY(20px); }
        }

        .stat-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 10px 12px;
        }
        @media (min-width: 480px) {
          .stat-card { border-radius: 12px; padding: 1rem 1.25rem; }
        }

        .upload-zone {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 1.5rem 1rem;
          text-align: center;
          cursor: pointer;
          background: #fafafa;
          transition: border-color 0.15s;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-zone:hover { border-color: #1a7a4a; }

        .form-input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: #1a1a1a;
          outline: none;
          font-family: inherit;
          width: 100%;
          min-height: 42px;
        }
        .form-input:focus { border-color: #1a7a4a; box-shadow: 0 0 0 3px rgba(26,122,74,0.1); }
      `}</style>

      {/* Header */}
      <div className="topbar">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
            Category Management
          </h1>
          <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Manage your product categories
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { resetForm(); setActiveTab("add"); }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span> Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { label: "Total", value: totalCount, badge: "all time", green: false },
          { label: "Active", value: activeCount, badge: "✓ live", green: true },
          { label: "Inactive", value: inactiveCount, badge: "hidden", green: false },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>
              {s.value}
            </div>
            <span style={{
              display: "inline-block", fontSize: 10, padding: "2px 8px",
              borderRadius: 20, marginTop: 4, fontWeight: 500,
              background: s.green ? "#e1f5ee" : "#f0f0f0",
              color: s.green ? "#0f6e56" : "#666",
            }}>
              {s.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === "view" ? " active" : ""}`}
          onClick={() => { setActiveTab("view"); fetchCategories(); }}
        >
          ⊞ View
        </button>
        <button
          className={`tab-btn${activeTab === "add" ? " active" : ""}`}
          onClick={() => { resetForm(); setActiveTab("add"); }}
        >
          ＋ {editId ? "Edit" : "Add"}
        </button>
      </div>

      {/* ── VIEW TAB ── */}
      {activeTab === "view" && (
        <div style={styles.panel}>

          {/* Search + Filter */}
          <div className="search-row">
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)", fontSize: 14, color: "#aaa",
              }}>🔍</span>
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-row">
              <select
                className="form-input"
                style={{ minWidth: 120, cursor: "pointer" }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="btn-ghost" onClick={fetchCategories}>
                ↻ Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={styles.spinner} />
              <p style={{ color: "#888", marginTop: 16 }}>Loading categories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <p style={{ color: "#888" }}>No categories found</p>
              <button
                className="btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => { resetForm(); setActiveTab("add"); }}
              >
                Add your first category
              </button>
            </div>
          ) : (
            <div className="cat-grid">
              {filtered.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  onEdit={() => handleEdit(cat)}
                  onDelete={() => handleDelete(cat)}
                  onToggle={() => handleToggleStatus(cat)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD/EDIT TAB ── */}
      {activeTab === "add" && (
        <div style={styles.panel}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: "#1a1a1a",
            marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: "#1a7a4a", fontSize: 18 }}>📁</span>
            {editId ? "Edit Category" : "New Category"}
          </div>

          <div className="form-grid">
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Category name <span style={{ color: "#e24b4a" }}>*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Fresh Vegetables"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Status</label>
              <select
                className="form-input"
                style={{ cursor: "pointer" }}
                value={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="form-full" style={styles.formGroup}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                className="form-input"
                style={{ resize: "vertical", minHeight: 80 }}
                placeholder="Brief description of the category..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-full" style={styles.formGroup}>
              <label style={styles.formLabel}>
                Thumbnail image {!editId && <span style={{ color: "#e24b4a" }}>*</span>}
              </label>
              <div
                className="upload-zone"
                onClick={() => fileRef.current?.click()}
              >
                {uploadPreview ? (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={uploadPreview}
                      alt="preview"
                      style={{ height: 80, borderRadius: 8, objectFit: "cover", marginBottom: 8 }}
                    />
                    <p style={{ fontSize: 13, color: "#0f6e56", fontWeight: 500 }}>
                      {uploadedFile ? uploadedFile.name : "Current thumbnail"}
                    </p>
                    <span style={{ fontSize: 12, color: "#888" }}>Tap to replace</span>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>☁</div>
                    <p style={{ fontSize: 13, color: "#555" }}>Tap to upload thumbnail</p>
                    <span style={{ fontSize: 12, color: "#999", marginTop: 4, display: "block" }}>
                      PNG, JPG, WEBP up to 5MB
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div style={{
            display: "flex", gap: 10, justifyContent: "flex-end",
            marginTop: "1.5rem", paddingTop: "1.25rem",
            borderTop: "1px solid #eee", flexWrap: "wrap",
          }}>
            <button className="btn-ghost" onClick={resetForm}>Clear</button>
            <button
              className="btn-primary"
              style={{ opacity: submitting ? 0.7 : 1, flex: 1, justifyContent: "center", maxWidth: 200 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Saving..." : editId ? "✓ Update" : "✓ Save category"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast${toast.type === "error" ? " error" : ""}${!toast.show ? " hidden" : ""}`}>
        {toast.type === "error" ? "✗" : "✓"} {toast.msg}
      </div>
    </div>
  );
}

function CategoryCard({ cat, onEdit, onDelete, onToggle }) {
  return (
    <div className="cat-card">
      <div style={{
        height: 100, background: "#f5f6fa",
        display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative", overflow: "hidden",
      }}>
        {cat.thumbnail ? (
          <img
            src={cat.thumbnail}
            alt={cat.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 36 }}>📦</span>
        )}
        <span style={{
          position: "absolute", top: 8, right: 8,
          width: 8, height: 8, borderRadius: "50%",
          background: cat.isActive ? "#1a7a4a" : "#aaa",
          boxShadow: "0 0 0 2px #fff",
        }} />
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: "#1a1a1a",
          marginBottom: 3, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {cat.name}
        </div>
        <div style={{
          fontSize: 11, color: "#888", lineHeight: 1.4,
          marginBottom: 8, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {cat.description || "No description"}
        </div>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #f0f0f0", paddingTop: 8,
        }}>
          <span style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 20,
            fontWeight: 600,
            background: cat.isActive ? "#e1f5ee" : "#f0f0f0",
            color: cat.isActive ? "#0f6e56" : "#666",
          }}>
            {cat.isActive ? "✓ Active" : "Inactive"}
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <button className="icon-btn" onClick={onToggle} title="Toggle status">
              {cat.isActive ? "⏸" : "▶"}
            </button>
            <button className="icon-btn" onClick={onEdit} title="Edit">✎</button>
            <button className="icon-btn icon-btn-danger" onClick={onDelete} title="Delete">🗑</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "1rem",
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#f5f6fa",
    minHeight: "100vh",
  },
  panel: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: "1rem",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid #eee",
    borderTop: "3px solid #1a7a4a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  formLabel: { fontSize: 13, fontWeight: 600, color: "#555" },
};