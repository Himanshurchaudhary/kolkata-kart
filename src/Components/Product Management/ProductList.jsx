import React, { useState, useEffect, useCallback } from 'react';
import ProductDetailModal from './Productdetailmodal';
import AddProductPage from '../Admin/Addproductpage';
import BulkImportModal from './BulkImportModal';

import { Search, Filter, RefreshCw, Eye, ChevronLeft, ChevronRight, Pencil, Trash2, X, SlidersHorizontal } from 'lucide-react';

const API_BASEA = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASEA}/api/products/all?showAll=true`;
const PER_PAGE = 20;

const getName = (field) => {
  if (!field) return null;
  if (typeof field === 'object') return field.name ?? field.title ?? null;
  if (/^[a-f\d]{24}$/i.test(field)) return null;
  return field;
};

const fmt = (v) => (v && v > 0 ? `₹${v}` : '₹0');

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [shopFilter, setShopFilter] = useState('All Shop');
  const [catFilter, setCatFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('All Brand');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // mobile filter drawer

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}&limit=1000&page=1`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.status === 401) throw new Error('Unauthorized – please log in again');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.products ?? json.data ?? []);
      setProducts(list);
      setFiltered(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    let list = [...products];
    if (search.trim())
      list = list.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    if (shopFilter && shopFilter !== 'All Shop')
      list = list.filter(p => (p.shop ?? p.shopName ?? '') === shopFilter);
    if (catFilter)
      list = list.filter(p => getName(p.category) === catFilter);
    if (brandFilter && brandFilter !== 'All Brand')
      list = list.filter(p => getName(p.brand) === brandFilter);
    setFiltered(list);
    setPage(1);
  }, [search, shopFilter, catFilter, brandFilter, products]);

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASEA}/api/products/delete/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      showToast('Product deleted successfully!');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const shops = ['All Shop', ...new Set(products.map(p => p.shop ?? p.shopName).filter(Boolean))];
  const cats = ['', ...new Set(products.map(p => getName(p.category)).filter(Boolean))];
  const brands = ['All Brand', ...new Set(products.map(p => getName(p.brand)).filter(Boolean))];

  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, filtered.length);

  const activeFilterCount = [
    shopFilter !== 'All Shop' ? 1 : 0,
    catFilter ? 1 : 0,
    brandFilter !== 'All Brand' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (editProduct) {
    return (
      <AddProductPage
        existingProduct={editProduct}
        onSaved={() => { setEditProduct(null); fetchProducts(); showToast('Product updated successfully!'); }}
        onCancel={() => setEditProduct(null)}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8F9FB', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        select:focus, input:focus { outline: none; border-color: #00B14F !important; box-shadow: 0 0 0 2px rgba(0,177,79,0.12); }
        .product-row:hover { background: #FAFAFA; }
        .action-btn:hover { opacity: 0.85; }
        * { box-sizing: border-box; }

        /* Desktop styles */
        .desktop-table { display: table; }
        .mobile-cards { display: none; }
        .topbar-desktop-filters { display: flex; }
        .topbar-mobile-row { display: none; }

        @media (max-width: 768px) {
          .desktop-table { display: none; }
          .mobile-cards { display: block; }
          .topbar-desktop-filters { display: none !important; }
          .topbar-mobile-row { display: flex !important; }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #EAECF0',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1F2B' }}>Product List</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowImport(true)} style={greenBtnStyle}>
              📥 <span style={{ marginLeft: 4 }}>Import</span>
            </button>
            <button onClick={fetchProducts} style={iconBtnStyle} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Search + Filter toggle row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%', height: 38, paddingLeft: 32, paddingRight: 12,
                fontSize: 13, color: '#374151',
                border: '1px solid #DCDFE4', borderRadius: 8, background: '#fff',
              }}
            />
          </div>
          {/* Desktop filters inline */}
          <div className="topbar-desktop-filters" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={shopFilter} onChange={e => setShopFilter(e.target.value)} style={selectStyle}>
              {shops.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selectStyle}>
              {cats.map(c => <option key={c ?? '__none__'} value={c ?? ''}>{c || 'Category'}</option>)}
            </select>
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={selectStyle}>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(true)}
            className="topbar-mobile-row"
            style={{
              ...iconBtnStyle,
              background: activeFilterCount > 0 ? '#00B14F' : '#1A1F2B',
              position: 'relative',
              display: 'none', // overridden by media query
            }}
          >
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, background: '#EF4444',
                borderRadius: '50%', fontSize: 10, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {!loading && !error && (
        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== products.length && ` (filtered from ${products.length})`}
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setShopFilter('All Shop'); setCatFilter(''); setBrandFilter('All Brand'); }}
              style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              Clear filters ×
            </button>
          )}
        </div>
      )}

      {/* ── Desktop Table ── */}
      <div className="desktop-table" style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 10, border: '1px solid #EAECF0', overflow: 'hidden' }}>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={fetchProducts} />}
        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #EAECF0' }}>
                {['SL.', 'Thumbnail', 'Product Name', 'Shop', 'Brand', 'Category', 'Price', 'Disc. Price', 'Action'].map(h => (
                  <th key={h} style={thStyle(h)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>No products found.</td></tr>
              )}
              {paginated.map((p, i) => (
                <tr key={p.id} className="product-row" style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                  <td style={tdStyle('SL.')}>{(page - 1) * PER_PAGE + i + 1}</td>
                  <td style={tdStyle('Thumbnail')}>
                    <Thumb src={p.thumbnail} alt={p.name} size={40} />
                  </td>
                  <td style={tdStyle('Product Name')}>
                    <span style={{ fontWeight: 500, color: '#1A1F2B' }}>{p.name}</span>
                  </td>
                  <td style={tdStyle('Shop')}>{p.shop ?? p.shopName ?? <Dash />}</td>
                  <td style={tdStyle('Brand')}>{getName(p.brand) ?? <Dash />}</td>
                  <td style={tdStyle('Category')}>{getName(p.category) ?? <Dash />}</td>
                  <td style={tdStyle('Price')}>{fmt(p.sellingPrice ?? p.price)}</td>
                  <td style={tdStyle('Disc. Price')}>{fmt(p.discountPrice)}</td>
                  <td style={{ ...tdStyle('Action'), whiteSpace: 'nowrap' }}>
                    <ActionButtons
                      onView={() => setSelectedProduct(p)}
                      onEdit={() => setEditProduct(p)}
                      onDelete={() => setDeleteConfirm(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="mobile-cards" style={{ padding: '0 12px 16px' }}>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={fetchProducts} />}
        {!loading && !error && paginated.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>
            No products found.
          </div>
        )}
        {!loading && !error && paginated.map((p, i) => (
          <div key={p.id} style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #EAECF0',
            padding: 14,
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Thumbnail */}
              <Thumb src={p.thumbnail} alt={p.name} size={56} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1F2B', marginBottom: 4, lineHeight: 1.3 }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
                  {(p.shop ?? p.shopName) && (
                    <span style={tagStyle('#EFF6FF', '#3B82F6')}>{p.shop ?? p.shopName}</span>
                  )}
                  {getName(p.brand) && (
                    <span style={tagStyle('#F0FBF4', '#00B14F')}>{getName(p.brand)}</span>
                  )}
                  {getName(p.category) && (
                    <span style={tagStyle('#FFF7ED', '#F97316')}>{getName(p.category)}</span>
                  )}
                </div>
              </div>

              {/* Serial no */}
              <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                #{(page - 1) * PER_PAGE + i + 1}
              </span>
            </div>

            {/* Price row + actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1F2B' }}>
                  {fmt(p.sellingPrice ?? p.price)}
                </span>
                {p.discountPrice > 0 && (
                  <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>
                    {fmt(p.discountPrice)}
                  </span>
                )}
              </div>
              <ActionButtons
                onView={() => setSelectedProduct(p)}
                onEdit={() => setEditProduct(p)}
                onDelete={() => setDeleteConfirm(p)}
                size={34}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ padding: '0 16px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {from}–{to} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageNavBtn(page === 1)}>
              <ChevronLeft size={15} />
            </button>
            <PaginationNumbers page={page} totalPages={totalPages} setPage={setPage} />
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageNavBtn(page === totalPages)}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Filter Drawer ── */}
      {showFilters && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowFilters(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
          />
          {/* Sheet */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '20px 16px 32px',
            animation: 'slideUp 0.25s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1F2B' }}>Filters</span>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#374151" />
              </button>
            </div>

            <FilterRow label="Shop">
              <select value={shopFilter} onChange={e => setShopFilter(e.target.value)} style={mobileSelectStyle}>
                {shops.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FilterRow>
            <FilterRow label="Category">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={mobileSelectStyle}>
                {cats.map(c => <option key={c ?? '__none__'} value={c ?? ''}>{c || 'All Categories'}</option>)}
              </select>
            </FilterRow>
            <FilterRow label="Brand">
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={mobileSelectStyle}>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FilterRow>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => { setShopFilter('All Shop'); setCatFilter(''); setBrandFilter('All Brand'); }}
                style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                style={{ flex: 2, height: 44, borderRadius: 10, border: 'none', background: '#00B14F', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* ── Delete Confirm Dialog ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* On mobile: bottom sheet; on desktop: centered */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '28px 20px 32px',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.2s ease-out',
            margin: '0 0 0 0',
          }}>
            <div style={{ width: 52, height: 52, background: '#FFF1F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="#EF4444" />
            </div>
            <h3 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#1A1F2B', margin: '0 0 8px' }}>Delete Product</h3>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6, padding: '0 8px' }}>
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: '#EF4444', fontSize: 14, fontWeight: 600, color: '#fff', cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Import Modal ── */}
      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); fetchProducts(); showToast('Products imported successfully!'); }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          color: '#fff', background: toast.type === 'error' ? '#EF4444' : '#00B14F',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'toastIn 0.2s ease-out',
          whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)',
        }}>
          {toast.type === 'error' ? '⚠️' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function Thumb({ src, alt, size }) {
  if (src) return (
    <img src={src} alt={alt} referrerPolicy="no-referrer" crossOrigin="anonymous"
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, border: '1px solid #EAECF0', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
  return (
    <div style={{ width: size, height: size, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 10, flexShrink: 0 }}>
      N/A
    </div>
  );
}

function ActionButtons({ onView, onEdit, onDelete, size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <button className="action-btn" style={actionBtnStyle('#F0FBF4', '#C7EDDA', size)} title="View" onClick={onView}>
        <Eye size={size === 34 ? 16 : 14} color="#00B14F" />
      </button>
      <button className="action-btn" style={actionBtnStyle('#EFF6FF', '#BFDBFE', size)} title="Edit" onClick={onEdit}>
        <Pencil size={size === 34 ? 16 : 14} color="#3B82F6" />
      </button>
      <button className="action-btn" style={actionBtnStyle('#FFF1F2', '#FECDD3', size)} title="Delete" onClick={onDelete}>
        <Trash2 size={size === 34 ? 16 : 14} color="#EF4444" />
      </button>
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function PaginationNumbers({ page, totalPages, setPage }) {
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <>
      {start > 1 && <><button onClick={() => setPage(1)} style={pageNumBtn(false)}>1</button>{start > 2 && <span style={{ fontSize: 13, color: '#9CA3AF', alignSelf: 'center' }}>…</span>}</>}
      {nums.map(n => <button key={n} onClick={() => setPage(n)} style={pageNumBtn(n === page)}>{n}</button>)}
      {end < totalPages && <><span style={{ fontSize: 13, color: '#9CA3AF', alignSelf: 'center' }}>…</span><button onClick={() => setPage(totalPages)} style={pageNumBtn(false)}>{totalPages}</button></>}
    </>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
      Loading products…
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#DC2626', fontSize: 14 }}>
      ⚠️ {error}&nbsp;
      <button onClick={onRetry} style={{ color: '#00B14F', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
    </div>
  );
}

function Dash() {
  return <span style={{ color: '#9CA3AF' }}>—</span>;
}

/* ── Style helpers ── */
const selectStyle = {
  height: 34, padding: '0 10px', fontSize: 13, color: '#374151',
  border: '1px solid #DCDFE4', borderRadius: 7, background: '#fff', cursor: 'pointer',
};
const mobileSelectStyle = {
  width: '100%', height: 44, padding: '0 12px', fontSize: 14, color: '#374151',
  border: '1px solid #DCDFE4', borderRadius: 10, background: '#fff', cursor: 'pointer',
};
const greenBtnStyle = {
  height: 38, padding: '0 14px', background: '#00B14F', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
};
const iconBtnStyle = {
  width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#1A1F2B', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
  flexShrink: 0,
};
const actionBtnStyle = (bg, border, size = 30) => ({
  width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: bg, border: `1px solid ${border}`, borderRadius: 7, cursor: 'pointer',
  transition: 'opacity 0.15s',
});
const tagStyle = (bg, color) => ({
  fontSize: 11, fontWeight: 500, color, background: bg,
  padding: '2px 7px', borderRadius: 20,
});
const thStyle = (h) => ({
  padding: '10px 14px',
  textAlign: ['SL.', 'Price', 'Disc. Price', 'Action'].includes(h) ? 'center' : 'left',
  fontWeight: 600, fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap',
});
const tdStyle = (h) => ({
  padding: '10px 14px', color: '#374151',
  textAlign: ['SL.', 'Price', 'Disc. Price', 'Action'].includes(h) ? 'center' : 'left',
});
const pageNumBtn = (active) => ({
  width: 34, height: 34, borderRadius: 7, border: active ? 'none' : '1px solid #DCDFE4',
  background: active ? '#00B14F' : '#fff', color: active ? '#fff' : '#374151',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
});
const pageNavBtn = (disabled) => ({
  width: 34, height: 34, borderRadius: 7, border: '1px solid #DCDFE4',
  background: '#fff', color: disabled ? '#D1D5DB' : '#374151',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});