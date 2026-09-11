// src/Admin/Pages/SellerManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Search, Eye, CheckCircle, Ban, Clock,
  X, Phone, Mail, MapPin, CreditCard, Building2,
  Truck, Clock3, FileText, ShieldCheck, ShieldOff,
  ChevronLeft, ChevronRight, RefreshCw, ExternalLink,
  User, Calendar, IndianRupee, Hourglass, AlertTriangle,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

/* ── Badge component ── */
const StatusBadge = ({ status }) => {
  const map = {
    verified: { label: 'Verified', bg: '#D1F2D8', color: '#00B14F', Icon: CheckCircle },
    pending:  { label: 'Pending',  bg: '#FEF9C3', color: '#CA8A04', Icon: Hourglass   },
    blocked:  { label: 'Blocked',  bg: '#FEE2E2', color: '#DC2626', Icon: Ban         },
  };
  const { label, bg, color, Icon } = map[status] || map.pending;
  return (
    <span style={{ background: bg, color }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold">
      <Icon size={11} />
      {label}
    </span>
  );
};

/* ── Info row inside modal ── */
const InfoRow = ({ icon: Icon, label, value, link }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-[#F0FBF4] flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={14} color="#00B14F" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
      {link
        ? <a href={link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#00B14F] flex items-center gap-1 hover:underline">
            View File <ExternalLink size={11} />
          </a>
        : <p className="text-sm font-semibold text-gray-800 break-words">{value || '—'}</p>
      }
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
/* SELLER DETAIL MODAL                                             */
/* ════════════════════════════════════════════════════════════════ */
function SellerModal({ seller, onClose, onAction }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'verify' | 'block' | 'unblock'

  if (!seller) return null;

  const status = !seller.is_active
    ? 'blocked'
    : seller.is_approved
      ? 'verified'
      : 'pending';

  const doAction = async (action) => {
    setActionLoading(true);
    await onAction(seller.id, action);
    setActionLoading(false);
    setConfirm(null);
  };

  const fullAddress = [seller.shop_street, seller.shop_city, seller.shop_state, seller.shop_pincode]
    .filter(Boolean).join(', ');
  const pickupAddress = seller.same_as_shop
    ? 'Same as shop address'
    : [seller.pickup_street, seller.pickup_city, seller.pickup_state, seller.pickup_pincode].filter(Boolean).join(', ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00B14F] to-[#00913f] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {seller.full_name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-base leading-tight truncate">{seller.full_name}</h2>
              <p className="text-xs text-gray-400 truncate">{seller.shop_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={status} />
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Section: Personal Info */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Personal Info</p>
            <div className="bg-gray-50 rounded-xl px-4">
              <InfoRow icon={User}       label="Full Name"    value={seller.full_name} />
              <InfoRow icon={Mail}       label="Email"        value={seller.email} />
              <InfoRow icon={Phone}      label="Mobile"       value={seller.mobile} />
              <InfoRow icon={Calendar}   label="Date of Birth" value={seller.dob ? new Date(seller.dob).toLocaleDateString('en-IN') : null} />
              <InfoRow icon={Calendar}   label="Registered On" value={new Date(seller.created_at).toLocaleString('en-IN')} />
            </div>
          </div>

          {/* Section: Shop Info */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Shop Info</p>
            <div className="bg-gray-50 rounded-xl px-4">
              <InfoRow icon={Store}        label="Shop Name"     value={seller.shop_name} />
              <InfoRow icon={Building2}    label="Category"      value={seller.shop_category} />
              <InfoRow icon={MapPin}       label="Shop Address"  value={fullAddress} />
              <InfoRow icon={FileText}     label="Description"   value={seller.shop_description} />
              <InfoRow icon={IndianRupee}  label="Delivery Charge" value={seller.delivery_charge ? `₹${seller.delivery_charge}` : '₹0'} />
              <InfoRow icon={Clock3}       label="Working Hours" value={`${seller.working_hours_from || '09:00'} – ${seller.working_hours_to || '18:00'}`} />
            </div>
          </div>

          {/* Section: Pickup Address */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pickup Address</p>
            <div className="bg-gray-50 rounded-xl px-4">
              <InfoRow icon={Truck}  label="Pickup Address" value={pickupAddress} />
            </div>
          </div>

          {/* Section: Documents */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Documents & KYC</p>
            <div className="bg-gray-50 rounded-xl px-4">
              <InfoRow icon={CreditCard} label="PAN Number"    value={seller.pan_number} />
              <InfoRow icon={CreditCard} label="Aadhar Number" value={seller.aadhar_number} />
              {seller.pan_card_url
                ? <InfoRow icon={FileText} label="PAN Card Image" link={seller.pan_card_url} />
                : <InfoRow icon={FileText} label="PAN Card Image" value="Not uploaded" />
              }
            </div>
          </div>

          {/* Section: Payment */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Details</p>
            <div className="bg-gray-50 rounded-xl px-4">
              <InfoRow icon={IndianRupee} label="UPI ID"     value={seller.upi_id} />
              <InfoRow icon={Phone}       label="UPI Mobile" value={seller.upi_mobile} />
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">

          {/* Confirm prompt */}
          {confirm && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium flex-1">
                {confirm === 'verify' && 'Approve this seller? They can start selling immediately.'}
                {confirm === 'block'  && 'Block this seller? Their account will be disabled.'}
                {confirm === 'unblock' && 'Unblock this seller? Their account will be re-enabled.'}
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => doAction(confirm)}
                  disabled={actionLoading}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all"
                  style={{ background: confirm === 'verify' ? '#00B14F' : '#DC2626', opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading ? '...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {/* Verify button — show if pending */}
            {status === 'pending' && (
              <button
                onClick={() => setConfirm('verify')}
                className="flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#00B14F,#00913f)' }}
              >
                <ShieldCheck size={16} /> Approve Seller
              </button>
            )}

            {/* Block / Unblock */}
            {status !== 'blocked' ? (
              <button
                onClick={() => setConfirm('block')}
                className="flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 bg-red-500"
              >
                <ShieldOff size={16} /> Block
              </button>
            ) : (
              <button
                onClick={() => setConfirm('unblock')}
                className="flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: '#64748B' }}
              >
                <ShieldCheck size={16} /> Unblock
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/* MAIN SELLER MANAGEMENT PAGE                                     */
/* ════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'all',      label: 'All',      color: '#64748B' },
  { key: 'pending',  label: 'Pending',  color: '#CA8A04' },
  { key: 'verified', label: 'Verified', color: '#00B14F' },
  { key: 'blocked',  label: 'Blocked',  color: '#DC2626' },
];

const PAGE_SIZE = 10;

export default function SellerManagement() {
  const [sellers,      setSellers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState(null);
  const [page,         setPage]         = useState(1);
  const [toast,        setToast]        = useState(null);

  const token = localStorage.getItem('adminToken');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/adminSellers/sellers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSellers(data.sellers || []);
    } catch {
      showToast('Failed to load sellers', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  /* ── Filter sellers ── */
  const getStatus = (s) => {
    if (!s.is_active)  return 'blocked';
    if (s.is_approved) return 'verified';
    return 'pending';
  };

  const filtered = sellers.filter(s => {
    const matchTab    = activeTab === 'all' || getStatus(s) === activeTab;
    const q           = search.toLowerCase();
    const matchSearch = !q || [s.full_name, s.email, s.shop_name, s.mobile]
      .some(v => v?.toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    all:      sellers.length,
    pending:  sellers.filter(s => getStatus(s) === 'pending').length,
    verified: sellers.filter(s => getStatus(s) === 'verified').length,
    blocked:  sellers.filter(s => getStatus(s) === 'blocked').length,
  };

  /* ── Actions: verify / block / unblock ── */
  const handleAction = async (sellerId, action) => {
    try {
      const body = action === 'verify'
        ? { is_approved: 1, is_active: 1 }
        : action === 'block'
          ? { is_active: 0 }
          : { is_active: 1 };

      const res  = await fetch(`${API}/api/adminSellers/sellers/${sellerId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      showToast(
        action === 'verify'  ? 'Seller approved successfully!' :
        action === 'block'   ? 'Seller blocked.'               :
                               'Seller unblocked.'
      );

      // Update local state
      setSellers(prev => prev.map(s => {
        if (s.id !== sellerId) return s;
        if (action === 'verify')  return { ...s, is_approved: 1, is_active: 1 };
        if (action === 'block')   return { ...s, is_active: 0 };
        return { ...s, is_active: 1 };
      }));

      // Update selected seller in modal
      setSelected(prev => {
        if (!prev || prev.id !== sellerId) return prev;
        if (action === 'verify')  return { ...prev, is_approved: 1, is_active: 1 };
        if (action === 'block')   return { ...prev, is_active: 0 };
        return { ...prev, is_active: 1 };
      });
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  /* ── Tab change resets page ── */
  const handleTabChange = (key) => { setActiveTab(key); setPage(1); };
  const handleSearch    = (v)   => { setSearch(v);      setPage(1); };

  return (
    <div className="min-h-full">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 transition-all"
          style={{ background: toast.type === 'error' ? '#DC2626' : '#00B14F' }}
        >
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D1F2D8] flex items-center justify-center">
            <Store size={20} color="#00B14F" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Seller Management</h1>
            <p className="text-xs text-gray-400">{sellers.length} sellers registered</p>
          </div>
        </div>
        <button
          onClick={fetchSellers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all self-start sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stat Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {TABS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className="text-left p-3 rounded-xl border transition-all"
            style={{
              background: activeTab === key ? color + '15' : '#fff',
              borderColor: activeTab === key ? color + '60' : '#e5e7eb',
            }}
          >
            <p className="text-2xl font-black" style={{ color: activeTab === key ? color : '#1a1a1a' }}>
              {counts[key]}
            </p>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto hide-scrollbar">
          {TABS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5"
              style={{
                background: activeTab === key ? color : 'transparent',
                color:      activeTab === key ? '#fff'  : '#64748B',
              }}
            >
              {key === 'pending'  && <Clock size={11} />}
              {key === 'verified' && <CheckCircle size={11} />}
              {key === 'blocked'  && <Ban size={11} />}
              {label}
              <span className="opacity-70">({counts[key]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name, email, shop, mobile…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00B14F] focus:ring-2 focus:ring-[#00B14F]/10 transition-all bg-gray-50"
            />
          </div>
        </div>

        {/* ── Table / List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm font-semibold">Loading sellers…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Store size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-semibold">No sellers found</p>
            <p className="text-xs mt-1">Try changing the filter or search term</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Seller</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Shop</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Mobile</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, idx) => {
                    const status = getStatus(s);
                    return (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B14F] to-[#00913f] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                              {s.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{s.full_name}</p>
                              <p className="text-xs text-gray-400 truncate">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700 max-w-[150px] truncate">{s.shop_name}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{s.mobile}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.shop_category}</td>
                        <td className="px-4 py-3"><StatusBadge status={status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(s.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelected(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0FBF4] text-[#00B14F] text-xs font-bold hover:bg-[#D1F2D8] transition-colors"
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginated.map((s) => {
                const status = getStatus(s);
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00B14F] to-[#00913f] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {s.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{s.full_name}</p>
                        <StatusBadge status={status} />
                      </div>
                      <p className="text-xs text-gray-400 truncate">{s.shop_name}</p>
                      <p className="text-xs text-gray-400">{s.mobile}</p>
                    </div>
                    <button
                      onClick={() => setSelected(s)}
                      className="w-9 h-9 rounded-xl bg-[#F0FBF4] flex items-center justify-center text-[#00B14F] flex-shrink-0"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) => n === '…'
                      ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
                      : <button
                          key={n}
                          onClick={() => setPage(n)}
                          className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: page === n ? '#00B14F' : 'transparent',
                            color:      page === n ? '#fff'    : '#64748B',
                          }}
                        >{n}</button>
                    )
                  }
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <SellerModal
          seller={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}