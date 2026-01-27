'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    item: { name: string };
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    notes: string | null;
    items: OrderItem[];
    delivery: {
        status: string;
        kurir: { name: string; phone: string } | null;
    } | null;
    createdAt: string;
}

export default function UserOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch('/api/orders');
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
        fetchOrders();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            PROCESSING: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            READY_TO_SHIP: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            SHIPPED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
            COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Menunggu Konfirmasi',
            CONFIRMED: 'Dikonfirmasi',
            PROCESSING: 'Diproses',
            READY_TO_SHIP: 'Siap Dikirim',
            SHIPPED: 'Dalam Pengiriman',
            DELIVERED: 'Terkirim',
            COMPLETED: 'Selesai',
            CANCELLED: 'Dibatalkan',
        };
        return labels[status] || status;
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Pre-Order Saya 📋</h1>
                    <p className="text-slate-400 mt-2">Pantau status pesanan Anda</p>
                </div>
                <Link
                    href="/dashboard/user/items"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    + Buat Pre-Order
                </Link>
            </div>

            {/* Orders List */}
            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="font-semibold text-white text-lg">{order.orderNumber}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <span className="text-slate-400 text-sm">
                                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-3">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-300">
                                                {item.item.name} x {item.quantity}
                                            </span>
                                            <span className="text-white">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-700/50 mt-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Total</span>
                                        <span className="text-xl font-bold text-white">{formatCurrency(order.totalAmount)}</span>
                                    </div>
                                </div>

                                {order.delivery && (
                                    <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-slate-400">Pengiriman</p>
                                        <p className="text-white mt-1">
                                            Kurir: {order.delivery.kurir?.name || 'Belum ditugaskan'}
                                        </p>
                                        {order.delivery.kurir?.phone && (
                                            <p className="text-slate-400 text-sm">Tel: {order.delivery.kurir.phone}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-slate-400 text-lg mb-4">Belum ada pre-order</p>
                    <Link
                        href="/dashboard/user/items"
                        className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Mulai Pre-Order
                    </Link>
                </div>
            )}
        </div>
    );
}
