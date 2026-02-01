'use client';

import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
}

interface Item {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
}

interface CreditApplication {
    id: string;
    applicationNo: string;
    userId: string;
    user: User;
    item: Item;
    quantity: number;
    totalPrice: number;
    tenor: number;
    monthlyAmount: number;
    status: string;
    notes: string | null;
    createdAt: string;
}

export default function OwnerCreditsPage() {
    const [applications, setApplications] = useState<CreditApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ id: string; show: boolean }>({ id: '', show: false });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/credit/applications');
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Setujui pengajuan kredit ini?')) return;
        setProcessing(id);
        try {
            const res = await fetch(`/api/credit/applications/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (res.ok) {
                fetchApplications();
            } else {
                alert('Gagal menyetujui pengajuan');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        setProcessing(rejectModal.id);
        try {
            const res = await fetch(`/api/credit/applications/${rejectModal.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNotes: rejectReason })
            });
            if (res.ok) {
                fetchApplications();
                setRejectModal({ id: '', show: false });
                setRejectReason('');
            } else {
                alert('Gagal menolak pengajuan');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(null);
        }
    };

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter(a => a.status === filter);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400',
            APPROVED: 'bg-green-500/20 text-green-400',
            REJECTED: 'bg-red-500/20 text-red-400',
            COMPLETED: 'bg-blue-500/20 text-blue-400',
        };
        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status]}`}>
                {status}
            </span>
        );
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
            <div>
                <h1 className="text-2xl font-bold text-white">Pengajuan Kredit</h1>
                <p className="text-slate-400 text-sm mt-1">Kelola pengajuan kredit dari user</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Menunggu</p>
                    <p className="text-2xl font-bold text-yellow-400">
                        {applications.filter(a => a.status === 'PENDING').length}
                    </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Disetujui</p>
                    <p className="text-2xl font-bold text-green-400">
                        {applications.filter(a => a.status === 'APPROVED').length}
                    </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Lunas</p>
                    <p className="text-2xl font-bold text-blue-400">
                        {applications.filter(a => a.status === 'COMPLETED').length}
                    </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Ditolak</p>
                    <p className="text-2xl font-bold text-red-400">
                        {applications.filter(a => a.status === 'REJECTED').length}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status === 'all' ? 'Semua' : status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-700/30">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">No. Aplikasi</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">User</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Barang</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Total</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Tenor</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Cicilan/bln</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredApps.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-700/20">
                                <td className="px-4 py-3">
                                    <p className="text-white font-medium">{app.applicationNo}</p>
                                    <p className="text-xs text-slate-500">{formatDate(app.createdAt)}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-white">{app.user.name}</p>
                                    <p className="text-xs text-slate-500">{app.user.phone || app.user.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-white">{app.item.name}</p>
                                    <p className="text-xs text-slate-500">x{app.quantity}</p>
                                </td>
                                <td className="px-4 py-3 text-white">{formatCurrency(app.totalPrice)}</td>
                                <td className="px-4 py-3 text-white">{app.tenor} bln</td>
                                <td className="px-4 py-3 text-purple-400 font-medium">{formatCurrency(app.monthlyAmount)}</td>
                                <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                                <td className="px-4 py-3">
                                    {app.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(app.id)}
                                                disabled={processing === app.id}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                Setuju
                                            </button>
                                            <button
                                                onClick={() => setRejectModal({ id: app.id, show: true })}
                                                disabled={processing === app.id}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-4">Tolak Pengajuan</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Alasan penolakan..."
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setRejectModal({ id: '', show: false })}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing !== null}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
