import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, KeyRound, ToggleLeft, ToggleRight, X, CheckCircle, ShoppingBag } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const Customers = () => {
    const [customers, setCustomers]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');

    // Detail modal
    const [selected, setSelected]       = useState(null);

    // Password modal
    const [pwdModal, setPwdModal]       = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [pwdLoading, setPwdLoading]   = useState(false);
    const [pwdError, setPwdError]       = useState('');
    const [pwdSuccess, setPwdSuccess]   = useState('');

    // Orders modal
    const [ordersModal, setOrdersModal]     = useState(null); // customer object
    const [orders, setOrders]               = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError]     = useState('');

    const token    = localStorage.getItem('adminToken');
    const navigate = useNavigate();

    // ── Fetch all customers ──
    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/auth/customers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setCustomers(data.customers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch orders for a customer ──
    const fetchOrders = async (customer) => {
        setOrdersModal(customer);
        setOrders([]);
        setOrdersError('');
        setOrdersLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/auth/customers/${customer.id}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                setOrdersError(data.message || 'Failed to load orders.');
            }
        } catch (err) {
            console.error(err);
            setOrdersError('Unable to connect.');
        } finally {
            setOrdersLoading(false);
        }
    };

    // ── Toggle active status ──
    const handleToggle = async (customer) => {
        try {
            const res  = await fetch(`${API_URL}/api/auth/customers/${customer.id}/toggle-status`, {
                method:  'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    // ── Update password ──
    const handlePasswordUpdate = async () => {
        setPwdError('');
        setPwdSuccess('');
        if (!newPassword)           { setPwdError('Please enter a password.'); return; }
        if (newPassword.length < 6) { setPwdError('Min 6 characters required.'); return; }

        setPwdLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/auth/customers/${pwdModal.id}/password`, {
                method:  'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:  `Bearer ${token}`,
                },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (!res.ok) { setPwdError(data.message); return; }
            setPwdSuccess('Password updated successfully!');
            setNewPassword('');
        } catch {
            setPwdError('Unable to connect.');
        } finally {
            setPwdLoading(false);
        }
    };

    // ── Order status badge color ──
    const statusColor = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'delivered':  return 'bg-green-100 text-green-700';
            case 'cancelled':  return 'bg-red-100 text-red-600';
            case 'processing': return 'bg-blue-100 text-blue-600';
            case 'shipped':    return 'bg-purple-100 text-purple-600';
            default:           return 'bg-yellow-100 text-yellow-700'; // pending
        }
    };

    // ── Filter by search ──
    const filtered = customers.filter(c =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>

            {/* Search */}
            <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Table */}
            {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Country</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((c, i) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            {c.avatar ? (
                                                <img src={c.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                                                    {c.fullName[0]}
                                                </div>
                                            )}
                                            {c.fullName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.country}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {/* View Details */}
                                            <button
                                                onClick={() => setSelected(c)}
                                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                title="View Details"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {/* Order History */}
                                            <button
                                                onClick={() => navigate(`/admin/customers/${c.id}/orders`)}
                                                className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600"
                                                title="Order History"
                                            >
                                                <ShoppingBag size={15} />
                                            </button>
                                            {/* Change Password */}
                                            <button
                                                onClick={() => { setPwdModal(c); setPwdError(''); setPwdSuccess(''); setNewPassword(''); }}
                                                className="p-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600"
                                                title="Change Password"
                                            >
                                                <KeyRound size={15} />
                                            </button>
                                            {/* Toggle Status */}
                                            <button
                                                onClick={() => handleToggle(c)}
                                                className={`p-1.5 rounded-lg ${c.isActive ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                                                title={c.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {c.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-8">No customers found.</p>
                    )}
                </div>
            )}

            {/* ── Detail Modal ── */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                        <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            {selected.avatar ? (
                                <img src={selected.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-2xl">
                                    {selected.fullName[0]}
                                </div>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{selected.fullName}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selected.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {selected.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            {[
                                ['Email',         selected.email],
                                ['Phone',         selected.phone],
                                ['Country',       selected.country],
                                ['Gender',        selected.gender || '—'],
                                ['Date of Birth', selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : '—'],
                                ['Joined',        new Date(selected.createdAt).toLocaleDateString()],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="text-gray-800 font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Orders Modal ── */}
            {ordersModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setOrdersModal(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                            <X size={16} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <ShoppingBag size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Order History</h2>
                                <p className="text-sm text-gray-500">{ordersModal.fullName}</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1">
                            {ordersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                </div>
                            ) : ordersError ? (
                                <p className="text-center text-red-500 text-sm py-8">{ordersError}</p>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <ShoppingBag size={40} className="mb-3 opacity-30" />
                                    <p className="text-sm">No orders found for this customer.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                                        <tr>
                                            <th className="px-3 py-3 whitespace-nowrap">Order ID</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3">Payment</th>
                                            <th className="px-3 py-3 text-center">Items</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3 whitespace-nowrap">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition">
                                                <td className="px-3 py-3 font-mono text-gray-700 text-xs whitespace-nowrap">
                                                    #{String(order.id).padStart(5, '0')}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${statusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-gray-600 capitalize whitespace-nowrap">
                                                    {order.paymentMethod || '—'}
                                                    {order.paymentStatus && (
                                                        <span className={`ml-1 text-xs ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                            ({order.paymentStatus})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-gray-600 text-center">
                                                    {order.totalItems ?? order.items?.length ?? '—'}
                                                </td>
                                                <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">
                                                    ₹{Number(order.totalAmount || order.total || 0).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            )}
                        </div>

                        {/* Footer summary */}
                        {orders.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                                <span>Total orders: <strong className="text-gray-800">{orders.length}</strong></span>
                                <span>
                                    Total spent:{' '}
                                    <strong className="text-gray-800">
                                        ₹{orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0).toLocaleString()}
                                    </strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Password Modal ── */}
            {pwdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setPwdModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <X size={16} />
                        </button>

                        <h2 className="text-lg font-bold text-gray-900 mb-1">Change Password</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Setting new password for <strong>{pwdModal.fullName}</strong>
                        </p>

                        {pwdError && (
                            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {pwdError}
                            </div>
                        )}

                        {pwdSuccess ? (
                            <div className="flex flex-col items-center text-center py-2">
                                <CheckCircle size={40} className="text-green-500 mb-2" />
                                <p className="text-green-700 font-semibold text-sm">{pwdSuccess}</p>
                                <button onClick={() => setPwdModal(null)} className="mt-4 text-sm text-gray-500 hover:text-green-600">
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={handlePasswordUpdate}
                                    disabled={pwdLoading}
                                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-full text-sm flex items-center justify-center gap-2"
                                >
                                    {pwdLoading && (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                    )}
                                    {pwdLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;