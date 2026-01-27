'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface DeliveryStats {
    assigned: number;
    inProgress: number;
    completed: number;
    pendingDeliveries: Array<{
        id: string;
        orderId: string;
        status: string;
        order: {
            orderNumber: string;
            user: { name: string; address: string; phone: string };
        };
        createdAt: string;
    }>;
}

export default function KurirDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DeliveryStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/kurir/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ASSIGNED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            PICKED_UP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            ON_THE_WAY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            ARRIVED: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
            CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
        return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            ASSIGNED: 'Ditugaskan',
            PICKED_UP: 'Diambil',
            ON_THE_WAY: 'Dalam Perjalanan',
            ARRIVED: 'Sampai Lokasi',
            DELIVERED: 'Diserahkan',
            CONFIRMED: 'Dikonfirmasi',
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
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Dashboard Kurir 🚚
                </h1>
                <p className="text-slate-400 mt-2">
                    Halo {session?.user?.name}, kelola pengantaran Anda di sini
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-xl rounded-2xl border border-yellow-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Ditugaskan</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.assigned || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Dalam Proses</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.inProgress || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Selesai Hari Ini</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.completed || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Deliveries */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">Tugas Pengantaran</h2>
                </div>
                <div className="p-6">
                    {stats?.pendingDeliveries && stats.pendingDeliveries.length > 0 ? (
                        <div className="space-y-4">
                            {stats.pendingDeliveries.map((delivery) => (
                                <div
                                    key={delivery.id}
                                    className="bg-slate-700/30 rounded-xl p-4 hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-white">{delivery.order.orderNumber}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                                                    {getStatusLabel(delivery.status)}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-slate-300">
                                                    <span className="text-slate-500">Penerima:</span> {delivery.order.user.name}
                                                </p>
                                                <p className="text-slate-300">
                                                    <span className="text-slate-500">Telepon:</span> {delivery.order.user.phone || '-'}
                                                </p>
                                                <p className="text-slate-300">
                                                    <span className="text-slate-500">Alamat:</span> {delivery.order.user.address || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={`/dashboard/kurir/deliveries/${delivery.id}`}
                                            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            Update Status
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-slate-400">Tidak ada tugas pengantaran saat ini</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
