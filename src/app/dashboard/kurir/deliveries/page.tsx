'use client';

import { useEffect, useState } from 'react';

interface Delivery {
    id: string;
    status: string;
    createdAt: string;
    order: {
        orderNumber: string;
        totalAmount: number;
        user: { name: string; address: string | null; phone: string | null };
    };
}

export default function KurirDeliveriesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    async function fetchDeliveries() {
        try {
            const res = await fetch('/api/kurir/deliveries');
            if (res.ok) {
                const data = await res.json();
                setDeliveries(data);
            }
        } catch (error) {
            console.error('Error fetching deliveries:', error);
        } finally {
            setLoading(false);
        }
    }

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/kurir/deliveries/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) fetchDeliveries();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ASSIGNED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            PICKED_UP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            ON_THE_WAY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return styles[status] || 'bg-slate-500/20 text-slate-400';
    };

    const getNextStatus = (status: string) => {
        const flow: Record<string, string> = {
            ASSIGNED: 'PICKED_UP',
            PICKED_UP: 'ON_THE_WAY',
            ON_THE_WAY: 'DELIVERED',
        };
        return flow[status];
    };

    const getNextStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PICKED_UP: 'Ambil Barang',
            ON_THE_WAY: 'Dalam Perjalanan',
            DELIVERED: 'Selesai Antar',
        };
        return labels[status] || status;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
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
                <h1 className="text-3xl font-bold text-white">Daftar Pengantaran 📦</h1>
                <p className="text-slate-400 mt-2">Kelola pengantaran yang ditugaskan ke Anda</p>
            </div>

            {deliveries.length > 0 ? (
                <div className="grid gap-4">
                    {deliveries.map((d) => {
                        const nextStatus = getNextStatus(d.status);
                        return (
                            <div
                                key={d.id}
                                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white font-semibold text-lg">{d.order.orderNumber}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(d.status)}`}>
                                                {d.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-300">{d.order.user.name}</p>
                                        {d.order.user.phone && (
                                            <p className="text-slate-400 text-sm">📞 {d.order.user.phone}</p>
                                        )}
                                        {d.order.user.address && (
                                            <p className="text-slate-400 text-sm">📍 {d.order.user.address}</p>
                                        )}
                                        <p className="text-white font-medium">{formatCurrency(d.order.totalAmount)}</p>
                                    </div>

                                    {nextStatus && (
                                        <button
                                            onClick={() => updateStatus(d.id, nextStatus)}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                        >
                                            {getNextStatusLabel(nextStatus)}
                                        </button>
                                    )}
                                    {d.status === 'DELIVERED' && (
                                        <span className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm">
                                            ✅ Selesai
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-slate-400 text-lg">Belum ada pengantaran</p>
                </div>
            )}
        </div>
    );
}
