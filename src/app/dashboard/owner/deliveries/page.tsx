'use client';

import { useEffect, useState } from 'react';

interface Delivery {
    id: string;
    status: string;
    createdAt: string;
    order: {
        orderNumber: string;
        totalAmount: number;
        user: { name: string; address: string | null };
    };
    kurir: { name: string; phone: string | null };
}

export default function OwnerDeliveriesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    async function fetchDeliveries() {
        try {
            const res = await fetch('/api/owner/deliveries');
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

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ASSIGNED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            PICKED_UP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            ON_THE_WAY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
            CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
        return styles[status] || 'bg-slate-500/20 text-slate-400';
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
                <h1 className="text-3xl font-bold text-white">Pengantaran 🚚</h1>
                <p className="text-slate-400 mt-2">Monitor semua pengantaran dalam sistem</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Order</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Customer</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Kurir</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Status</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {deliveries.map((d) => (
                                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{d.order.orderNumber}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white">{d.order.user.name}</p>
                                            <p className="text-slate-500 text-xs truncate max-w-[200px]">
                                                {d.order.user.address || '-'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white">{d.kurir.name}</p>
                                            <p className="text-slate-500 text-xs">{d.kurir.phone || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(d.status)}`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {new Date(d.createdAt).toLocaleDateString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                            {deliveries.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Belum ada pengantaran
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
