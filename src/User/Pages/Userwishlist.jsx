// src/Pages/UserWishlist.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star, Package, ArrowRight, Loader2 } from 'lucide-react';
import {
  fetchWishlist,
  removeFromWishlist,
  addToCart,
} from '../utils/cartWishlist';

import ProductCard from '../Components/ProductCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getImage = (prod) =>
  prod?.thumbnail || prod?.additionalImages?.[0] || null;

const formatPrice = (n) =>
  typeof n === 'number' ? `₹${n.toFixed(2)}` : '—';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: type === 'success' ? '#166534' : '#991b1b',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 600,
      boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      animation: 'toastIn 0.25s ease',
      whiteSpace: 'nowrap',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {type === 'success' ? <ShoppingCart size={15} /> : <Trash2 size={15} />}
      {message}
    </div>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyWishlist = ({ onBrowse }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 16px', gap: 16, textAlign: 'center',
  }}>
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Heart size={36} color="#16a34a" />
    </div>
    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
      Your wishlist is empty
    </h3>
    <p style={{ fontSize: 13, color: '#6b7280', margin: 0, maxWidth: 280 }}>
      Save products you love to your wishlist and add them to your cart when you're ready.
    </p>
    <button
      onClick={onBrowse}
      style={{
        marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 24px', background: '#16a34a', color: '#fff',
        border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      Browse Products <ArrowRight size={16} />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserWishlist = () => {
  const navigate = useNavigate();

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [removing,   setRemoving]   = useState({});
  const [addingCart, setAddingCart] = useState({});
  const [toast,      setToast]      = useState(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWishlist();
      const list = data.products || data.data || (Array.isArray(data) ? data : []);
      setProducts(list);
    } catch {
      setError('Failed to load wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail?.products || e.detail?.data;
      if (Array.isArray(updated)) setProducts(updated);
    };
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
  }, []);

  const handleRemove = async (productId) => {
    setRemoving(p => ({ ...p, [productId]: true }));
    try {
      await removeFromWishlist(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setToast({ message: 'Removed from wishlist', type: 'remove' });
    } catch {
      setToast({ message: 'Failed to remove item', type: 'remove' });
    } finally {
      setRemoving(p => ({ ...p, [productId]: false }));
    }
  };

  const handleAddToCart = async (productId) => {
    setAddingCart(p => ({ ...p, [productId]: true }));
    try {
      await addToCart(productId, 1);
      setToast({ message: 'Added to cart!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to add to cart', type: 'remove' });
    } finally {
      setAddingCart(p => ({ ...p, [productId]: false }));
    }
  };

  return (
    <div style={{ flex: 1, padding: '0 0 40px', minHeight: 0, boxSizing: 'border-box' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

        /* ── Wishlist grid ── */
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);   /* 2 cols on mobile */
          gap: 12px;
          animation: fadeUp 0.3s ease;
        }
        .wishlist-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        /* ── Tablet and up ── */
        @media (min-width: 560px) {
          .wishlist-grid,
          .wishlist-skeleton-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }

        /* ── Desktop ── */
        @media (min-width: 900px) {
          .wishlist-grid,
          .wishlist-skeleton-grid {
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 20px;
          }
        }

        /* ── Header ── */
        .wishlist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .wishlist-title {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wishlist-shop-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1.5px solid #16a34a;
          color: #16a34a;
          border-radius: 10px;
          padding: 7px 13px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .wishlist-shop-btn:hover {
          background: #16a34a;
          color: #fff;
        }

        @media (min-width: 480px) {
          .wishlist-title  { font-size: 22px; }
          .wishlist-shop-btn { font-size: 13px; padding: 8px 16px; }
        }
      `}</style>

      {/* Header */}
      <div className="wishlist-header">
        <h2 className="wishlist-title">
          <Heart size={20} color="#16a34a" fill="#16a34a" />
          Wishlist
          {!loading && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#16a34a',
              background: '#dcfce7', padding: '3px 10px', borderRadius: 20,
            }}>
              {products.length}
            </span>
          )}
        </h2>

        {products.length > 0 && (
          <button
            className="wishlist-shop-btn"
            onClick={() => navigate('/user/product')}
          >
            Continue Shopping <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="wishlist-skeleton-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              border: '1px solid #e8f5e9', animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ width: '100%', aspectRatio: '1/1', background: '#f3f4f6' }} />
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, width: '55%' }} />
                <div style={{ height: 14, background: '#f3f4f6', borderRadius: 6 }} />
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, width: '40%' }} />
                <div style={{ height: 34, background: '#f3f4f6', borderRadius: 10, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, color: '#991b1b', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={loadWishlist}
            style={{
              background: '#991b1b', color: '#fff', border: 'none',
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && products.length === 0 && (
        <EmptyWishlist onBrowse={() => navigate('/user/product')} />
      )}

      {/* Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="wishlist-grid">
          {products.map(prod => (
  <ProductCard
    key={prod.id}
    product={prod}
    onUnwish={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
  />
))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UserWishlist;