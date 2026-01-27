'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface OwnerStats {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeDeliveries: number;
    totalDebt: number;
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        status: string;
        totalAmount: number;
        user: { name: string };
        createdAt: string;
    }>;
}

export default function OwnerDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/owner/dashboard');
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
                    Dashboard Owner 👑
                </h1>
                <p className="text-slate-400 mt-2">
                    Selamat datang {session?.user?.name}, pantau seluruh sistem dari sini
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Users</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.totalUsers || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Pre-Order</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.totalOrders || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-xl rounded-2xl border border-yellow-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Menunggu Proses</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.pendingOrders || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Dalam Pengiriman</p>
                            <p className="text-3xl font-bold text-white mt-2">{stats?.activeDeliveries || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Nilai Order</p>
                            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(stats?.totalRevenue || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-xl rounded-2xl border border-red-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Hutang User</p>
                            <p className="text-2xl font-bold text-white mt-2">{formatCurrency(stats?.totalDebt || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Pre-Order Terbaru</h2>
                    <a
                        href="/dashboard/owner/orders"
                        className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                    >
                        Lihat Semua →
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Order</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">User</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Status</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Total</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-slate-300">{order.user.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white">{formatCurrency(order.totalAmount)}</td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(order.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
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
