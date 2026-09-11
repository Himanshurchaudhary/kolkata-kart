import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Search, Filter, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_OPTIONS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['all', 'cod', 'online', 'upi'];

const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'delivered':  return 'bg-green-100 text-green-700';
        case 'cancelled':  return 'bg-red-100 text-red-600';
        case 'processing': return 'bg-blue-100 text-blue-600';
        case 'shipped':    return 'bg-purple-100 text-purple-600';
        default:           return 'bg-yellow-100 text-yellow-700';
    }
};

const paymentStatusColor = (ps) =>
    ps === 'paid' ? 'text-green-600' : 'text-yellow-600';

const CustomerOrders = () => {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const token      = localStorage.getItem('adminToken');

    const [customer, setCustomer]   = useState(null);
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    // Filters
    const [search, setSearch]           = useState('');
    const [statusFilter, setStatus]     = useState('all');
    const [paymentFilter, setPayment]   = useState('all');
    const [dateFrom, setDateFrom]       = useState('');
    const [dateTo, setDateTo]           = useState('');

    // ── Fetch customer info ──
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const res  = await fetch(`${API_URL}/api/auth/customers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setCustomer(data.customer);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCustomer();
    }, [id]);

    // ── Fetch orders ──
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError('');
            try {
                const res  = await fetch(`${API_URL}/api/auth/customers/${id}/orders`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setOrders(data.orders);
                else setError(data.message || 'Failed to load orders.');
            } catch (err) {
                console.error(err);
                setError('Unable to connect.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [id]);

    // ── Apply filters ──
    const filtered = orders.filter((o) => {
        const orderId   = String(o.id).padStart(5, '0');
        const matchSearch =
            !search ||
            orderId.includes(search) ||
            (o.paymentMethod || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.status || '').toLowerCase().includes(search.toLowerCase());

        const matchStatus  = statusFilter === 'all'  || (o.status || '').toLowerCase() === statusFilter;
        const matchPayment = paymentFilter === 'all' || (o.paymentMethod || '').toLowerCase().includes(paymentFilter);

        const orderDate = new Date(o.createdAt);
        const matchFrom = !dateFrom || orderDate >= new Date(dateFrom);
        const matchTo   = !dateTo   || orderDate <= new Date(dateTo + 'T23:59:59');

        return matchSearch && matchStatus && matchPayment && matchFrom && matchTo;
    });

    // ── Stats ──
    const totalSpent    = filtered.reduce((s, o) => s + Number(o.totalAmount || o.total || 0), 0);
    const delivered     = filtered.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
    const cancelled     = filtered.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
    const pending       = filtered.filter(o => (o.status || '').toLowerCase() === 'pending').length;

    const clearFilters = () => {
        setSearch(''); setStatus('all'); setPayment('all');
        setDateFrom(''); setDateTo('');
    };
    const hasFilters = search || statusFilter !== 'all' || paymentFilter !== 'all' || dateFrom || dateTo;

    return (
        <div className="p-6 max-w-7xl mx-auto">

            {/* ── Back + Header ── */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/admin/customers')}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
                    {customer && (
                        <p className="text-sm text-gray-500 mt-0.5">
                            {customer.fullName} &nbsp;·&nbsp; {customer.email} &nbsp;·&nbsp; {customer.phone}
                        </p>
                    )}
                </div>
                {customer && (
                    <div className="ml-auto flex items-center gap-2">
                        {customer.avatar ? (
                            <img src={customer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">
                                {customer.fullName?.[0]}
                            </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Stats Cards ── */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Orders',  value: filtered.length,                       color: 'bg-blue-50 text-blue-700' },
                        { label: 'Delivered',      value: delivered,                             color: 'bg-green-50 text-green-700' },
                        { label: 'Pending',        value: pending,                               color: 'bg-yellow-50 text-yellow-700' },
                        { label: 'Total Spent',    value: `₹${totalSpent.toLocaleString()}`,    color: 'bg-purple-50 text-purple-700' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className={`rounded-xl p-4 ${color}`}>
                            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                            <p className="text-2xl font-bold">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filters ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                <div className="flex flex-wrap gap-3 items-end">

                    {/* Search */}
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-xs text-gray-500 mb-1 block">Search</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Order ID, status, payment..."
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatus(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white capitalize"
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Payment */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Payment</label>
                        <select
                            value={paymentFilter}
                            onChange={e => setPayment(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                            {PAYMENT_OPTIONS.map(p => (
                                <option key={p} value={p}>{p === 'all' ? 'All Payments' : p.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Clear */}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition"
                        >
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                </div>
            ) : error ? (
                <p className="text-center text-red-500 py-10">{error}</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <ShoppingBag size={48} className="mb-3 opacity-25" />
                    <p className="text-sm">No orders match your filters.</p>
                    {hasFilters && (
                        <button onClick={clearFilters} className="mt-3 text-sm text-green-600 hover:underline">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">Order ID</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Payment Method</th>
                                <th className="px-4 py-3">Pay Status</th>
                                <th className="px-4 py-3 text-center">Items</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 font-mono text-gray-700 font-semibold">
                                        #{String(order.id).padStart(5, '0')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 uppercase font-medium text-xs">
                                        {order.paymentMethod || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold capitalize ${paymentStatusColor(order.paymentStatus)}`}>
                                            {order.paymentStatus || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-center">
                                        {order.totalItems ?? order.items?.length ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">
                                        ₹{Number(order.totalAmount || order.total || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Footer count ── */}
            {!loading && filtered.length > 0 && (
                <p className="text-xs text-gray-400 mt-3 text-right">
                    Showing {filtered.length} of {orders.length} orders
                </p>
            )}
        </div>
    );
};

export default CustomerOrders;