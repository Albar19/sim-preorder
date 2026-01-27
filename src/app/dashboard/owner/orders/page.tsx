'use client';

import React, { useEffect, useState } from 'react';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    item: { name: string };
}

interface Kurir {
    id: string;
    name: string;
    phone: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    notes: string | null;
    createdAt: string;
    user: { name: string; email: string; phone: string | null };
    items: OrderItem[];
    delivery: { kurir: { name: string } } | null;
}

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: 'CONFIRMED', label: 'Dikonfirmasi', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'PROCESSING', label: 'Diproses', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { value: 'READY_TO_SHIP', label: 'Siap Kirim', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { value: 'SHIPPED', label: 'Dikirim', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { value: 'DELIVERED', label: 'Terkirim', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'COMPLETED', label: 'Selesai', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { value: 'CANCELLED', label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export default function OwnerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [kurirs, setKurirs] = useState<Kurir[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [assignModal, setAssignModal] = useState<string | null>(null);
    const [selectedKurir, setSelectedKurir] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchKurirs();
    }, []);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/owner/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchKurirs() {
        try {
            const res = await fetch('/api/owner/users');
            if (res.ok) {
                const users = await res.json();
                setKurirs(users.filter((u: { role: string }) => u.role === 'KURIR'));
            }
        } catch (error) {
            console.error('Error fetching kurirs:', error);
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/owner/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setOrders(prev =>
                    prev.map(order =>
                        order.id === orderId ? { ...order, status: newStatus } : order
                    )
                );
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdating(null);
        }
    };

    const handleAssignKurir = async (orderId: string) => {
        if (!selectedKurir) return;
        setAssigning(true);
        try {
            const res = await fetch(`/api/owner/orders/${orderId}/assign-kurir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kurirId: selectedKurir }),
            });

            if (res.ok) {
                // Refresh orders to get updated delivery info
                fetchOrders();
                setAssignModal(null);
                setSelectedKurir('');
            }
        } catch (error) {
            console.error('Error assigning kurir:', error);
        } finally {
            setAssigning(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusOption = (status: string) => {
        return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    };

    const canAssignKurir = (status: string) => {
        return ['CONFIRMED', 'PROCESSING'].includes(status);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Semua Order 📋</h1>
                <p className="text-slate-400 mt-2">Kelola dan update status pre-order</p>
            </div>

            {/* Assign Kurir Modal */}
            {assignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Assign Kurir</h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Pilih kurir untuk mengantar pesanan ini:
                        </p>
                        <select
                            value={selectedKurir}
                            onChange={(e) => setSelectedKurir(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                        >
                            <option value="">-- Pilih Kurir --</option>
                            {kurirs.map(k => (
                                <option key={k.id} value={k.id}>
                                    {k.name} {k.phone ? `(${k.phone})` : ''}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setAssignModal(null); setSelectedKurir(''); }}
                                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleAssignKurir(assignModal)}
                                disabled={!selectedKurir || assigning}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {assigning ? 'Menyimpan...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Order</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Customer</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Status</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Kurir</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Total</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {orders.map((order) => (
                                <React.Fragment key={order.id}>
                                    <tr className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{order.orderNumber}</p>
                                                <p className="text-slate-500 text-xs">
                                                    {new Date(order.createdAt).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white">{order.user.name}</p>
                                                <p className="text-slate-500 text-xs">{order.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                disabled={updating === order.id}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${getStatusOption(order.status).color} ${updating === order.id ? 'opacity-50' : ''}`}
                                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                            >
                                                {STATUS_OPTIONS.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.delivery ? (
                                                <span className="text-green-400 text-sm">
                                                    ✓ {order.delivery.kurir.name}
                                                </span>
                                            ) : canAssignKurir(order.status) ? (
                                                <button
                                                    onClick={() => setAssignModal(order.id)}
                                                    className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                                                >
                                                    Assign Kurir
                                                </button>
                                            ) : (
                                                <span className="text-slate-500 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-white">{formatCurrency(order.totalAmount)}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                                            >
                                                {expandedOrder === order.id ? 'Tutup' : 'Detail'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedOrder === order.id && (
                                        <tr key={`${order.id}-detail`}>
                                            <td colSpan={6} className="px-6 py-4 bg-slate-700/20">
                                                <div className="space-y-3">
                                                    <h4 className="text-white font-medium">Detail Item:</h4>
                                                    <div className="grid gap-2">
                                                        {order.items.map(item => (
                                                            <div key={item.id} className="flex justify-between text-sm bg-slate-800/50 px-4 py-2 rounded-lg">
                                                                <span className="text-slate-300">{item.item.name} x {item.quantity}</span>
                                                                <span className="text-white">{formatCurrency(item.price * item.quantity)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {order.notes && (
                                                        <div className="mt-3">
                                                            <p className="text-slate-400 text-sm">Catatan:</p>
                                                            <p className="text-slate-300 text-sm">{order.notes}</p>
                                                        </div>
                                                    )}
                                                    {order.user.phone && (
                                                        <div className="mt-2">
                                                            <p className="text-slate-400 text-sm">Telepon: <span className="text-slate-300">{order.user.phone}</span></p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        Belum ada order
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
