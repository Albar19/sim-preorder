'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
}

interface CreditApplication {
    id: string;
    applicationNo: string;
    itemId: string;
    quantity: number;
    totalPrice: number;
    tenor: number;
    monthlyAmount: number;
    status: string;
    item: Item;
}

export default function UserCreditsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<CreditApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/credit/applications');
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter(a => a.status === filter);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            APPROVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
            REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
            COMPLETED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        };
        const labels: Record<string, string> = {
            PENDING: 'Menunggu',
            APPROVED: 'Disetujui',
            REJECTED: 'Ditolak',
            COMPLETED: 'Lunas',
        };
        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || 'bg-slate-500/20 text-slate-400'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Pengajuan Kredit Saya</h1>
                    <p className="text-slate-400 text-sm mt-1">Lihat status pengajuan kredit barang Anda</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/user/items')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                    + Ajukan Kredit Baru
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status === 'all' ? 'Semua' : status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : status === 'COMPLETED' ? 'Lunas' : 'Ditolak'}
                    </button>
                ))}
            </div>

            {/* Applications List */}
            {filteredApps.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
                    <p className="text-slate-400">Belum ada pengajuan kredit</p>
                    <button
                        onClick={() => router.push('/dashboard/user/items')}
                        className="mt-4 text-purple-400 hover:text-purple-300"
                    >
                        Lihat katalog barang →
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredApps.map((app) => (
                        <div
                            key={app.id}
                            className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 hover:border-purple-500/30 transition-all cursor-pointer"
                            onClick={() => router.push(`/dashboard/user/credits/${app.id}`)}
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Item Image */}
                                <div className="w-20 h-20 bg-slate-700/50 rounded-lg overflow-hidden flex-shrink-0">
                                    {app.item.imageUrl ? (
                                        <img
                                            src={app.item.imageUrl}
                                            alt={app.item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500">{app.applicationNo}</p>
                                            <h3 className="text-lg font-semibold text-white">{app.item.name}</h3>
                                        </div>
                                        {getStatusBadge(app.status)}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                        <span className="text-slate-400">
                                            Qty: <span className="text-white">{app.quantity}</span>
                                        </span>
                                        <span className="text-slate-400">
                                            Total: <span className="text-white">{formatCurrency(app.totalPrice)}</span>
                                        </span>
                                        <span className="text-slate-400">
                                            Tenor: <span className="text-white">{app.tenor} bulan</span>
                                        </span>
                                        <span className="text-slate-400">
                                            Cicilan: <span className="text-purple-400 font-medium">{formatCurrency(app.monthlyAmount)}/bln</span>
                                        </span>
                                        {app.status === 'PENDING' && app.tenor > 1 && (
                                            <span className="text-slate-400">
                                                Estimasi Jatuh Tempo: <span className="text-green-400">1 {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
