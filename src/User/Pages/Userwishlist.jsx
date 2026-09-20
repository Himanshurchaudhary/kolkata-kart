// src/Pages/UserWishlist.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Gift, ArrowRight, Loader2 } from 'lucide-react';
import {
  fetchWishlist,
  fetchComboWishlist,
  removeComboFromWishlist,
  addComboToCart,
} from '../utils/cartWishlist';

import ProductCard from '../Components/ProductCard';

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
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {type === 'success' ? <ShoppingCart size={15} /> : <Trash2 size={15} />}
      {message}
    </div>
  );
};

// ─── Combo Wishlist Card ──────────────────────────────────────────────────────
// Poora card clickable hai → /combos/:id (details page).
// Buttons ke andar stopPropagation hai, taaki wo card click trigger na karein.
const ComboWishlistCard = ({ combo, onOpen, onRemove, onAddToCart, removing, adding }) => {
  const comboPrice = Number(combo.comboPrice || 0);
  const totalMrp   = Number(combo.totalMrp || 0);
  const savingsPct = totalMrp > comboPrice
    ? Math.round(((totalMrp - comboPrice) / totalMrp) * 100)
    : 0;
  const stock  = Number(combo.stockQuantity ?? 0);
  const isOOS  = stock === 0;
  const isLow  = !isOOS && stock <= 10;
  const items  = combo.products || [];

  return (
    <div
      onClick={() => onOpen(combo.id)}
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #c8e6c9',
        boxShadow: '0 2px 12px rgba(45,158,45,0.08)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        opacity: removing ? 0.6 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,158,45,0.18)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(45,158,45,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '1/1',
        background: 'linear-gradient(145deg, #f0faf0, #e8f5e9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {combo.thumbnail
          ? <img src={combo.thumbnail} alt={combo.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Gift size={48} color="#2d9e2d" strokeWidth={1.3} />
        }

        {savingsPct > 0 && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            background: 'linear-gradient(135deg,#ff6b35,#e53935)',
            color: '#fff', fontSize: 10, fontWeight: 800,
            padding: '3px 8px', borderRadius: 5,
          }}>{savingsPct}% OFF</span>
        )}

        {/* Remove (filled heart) */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(combo.id); }}
          disabled={removing}
          title="Remove from wishlist"
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: removing ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          {removing
            ? <Loader2 size={14} color="#ef4444" style={{ animation: 'spin 0.7s linear infinite' }} />
            : <Heart size={15} color="#ef4444" fill="#ef4444" />
          }
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <span style={{
          alignSelf: 'flex-start', fontSize: 10, fontWeight: 800,
          color: '#1b5e20', background: 'rgba(45,158,45,0.12)',
          border: '1px solid rgba(45,158,45,0.2)',
          padding: '2px 8px', borderRadius: 20,
        }}>🎁 COMBO • {items.length} Items</span>

        <div style={{
          fontSize: 13, fontWeight: 700, color: '#1a2332', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 35,
        }}>{combo.name}</div>

        {/* Mini product thumbs */}
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {items.slice(0, 4).map((p, i) => (
              <div key={p.id || i} title={p.name} style={{
                width: 28, height: 28, borderRadius: 6, overflow: 'hidden',
                background: '#f1f8f1', border: '1px solid #c8e6c9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {p.thumbnail
                  ? <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 12 }}>🛒</span>
                }
              </div>
            ))}
            {items.length > 4 && (
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: '#e8f5e9',
                border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#2d9e2d',
              }}>+{items.length - 4}</div>
            )}
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#1b5e20' }}>
            ₹{comboPrice.toFixed(2)}
          </span>
          {totalMrp > comboPrice && (
            <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>
              ₹{totalMrp.toFixed(2)}
            </span>
          )}
        </div>

        {isOOS && <div style={{ fontSize: 10, fontWeight: 700, color: '#c62828' }}>❌ Out of Stock</div>}
        {isLow && <div style={{ fontSize: 10, fontWeight: 700, color: '#e65100' }}>⚠️ Only {stock} left!</div>}

        {/* Add to cart */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(combo.id); }}
          disabled={isOOS || adding}
          style={{
            marginTop: 'auto', width: '100%', padding: '9px 0',
            background: isOOS ? '#ccc' : '#2d9e2d',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 12, fontWeight: 700,
            cursor: isOOS || adding ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {adding
            ? <><Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Adding…</>
            : <><ShoppingCart size={13} /> {isOOS ? 'Out of Stock' : 'Add to Cart'}</>
          }
        </button>
      </div>
    </div>
  );
};

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

  const [products,      setProducts]      = useState([]);
  const [combos,       setCombos]        = useState([]);
  const [loading,      setLoading]       = useState(true);
  const [error,        setError]         = useState(null);
  const [removingCombo, setRemovingCombo] = useState({});
  const [addingCombo,   setAddingCombo]   = useState({});
  const [toast,        setToast]         = useState(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Products aur combos alag-alag load hote hain.
      // Combo wishlist fail ho to bhi product wishlist dikhta rahe.
      const [prodRes, comboRes] = await Promise.allSettled([
        fetchWishlist(),
        fetchComboWishlist(),
      ]);

      if (prodRes.status === 'rejected') throw prodRes.reason;

      const data = prodRes.value;
      const list = data.products || data.data || (Array.isArray(data) ? data : []);
      setProducts(list);

      setCombos(comboRes.status === 'fulfilled' ? (comboRes.value.combos || []) : []);
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

  const handleRemoveCombo = async (comboId) => {
    setRemovingCombo(p => ({ ...p, [comboId]: true }));
    try {
      await removeComboFromWishlist(comboId);
      setCombos(prev => prev.filter(c => c.id !== comboId));
      setToast({ message: 'Removed from wishlist', type: 'remove' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to remove item', type: 'remove' });
    } finally {
      setRemovingCombo(p => ({ ...p, [comboId]: false }));
    }
  };

  const handleAddComboToCart = async (comboId) => {
    setAddingCombo(p => ({ ...p, [comboId]: true }));
    try {
      await addComboToCart(comboId, 1);
      setToast({ message: 'Combo added to cart!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to add to cart', type: 'remove' });
    } finally {
      setAddingCombo(p => ({ ...p, [comboId]: false }));
    }
  };

  const totalCount = products.length + combos.length;

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
              {totalCount}
            </span>
          )}
        </h2>

        {totalCount > 0 && (
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
      {!loading && !error && totalCount === 0 && (
        <EmptyWishlist onBrowse={() => navigate('/user/product')} />
      )}

      {/* Grid: pehle combos, phir products */}
      {!loading && !error && totalCount > 0 && (
        <div className="wishlist-grid">
          {combos.map(combo => (
            <ComboWishlistCard
              key={`combo-${combo.id}`}
              combo={combo}
              onOpen={(id) => navigate(`/combos/${id}`)}
              onRemove={handleRemoveCombo}
              onAddToCart={handleAddComboToCart}
              removing={!!removingCombo[combo.id]}
              adding={!!addingCombo[combo.id]}
            />
          ))}

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