'use client';

import { useEffect, useState } from 'react';

interface Installment {
    id: string;
    installmentNo: number;
    amount: number;
    dueDate: string;
    paidAmount: number;
    paidAt: string | null;
    status: string;
    application: {
        applicationNo: string;
        user: {
            id: string;
            name: string;
            phone: string | null;
        };
        item: {
            name: string;
        };
    };
}

export default function OwnerInstallmentsPage() {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('UNPAID');
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchInstallments();
    }, []);

    const fetchInstallments = async () => {
        try {
            const res = await fetch('/api/installments');
            const data = await res.json();
            setInstallments(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        if (!confirm('Konfirmasi pembayaran cicilan ini?')) return;
        setProcessing(id);
        try {
            const res = await fetch(`/api/installments/${id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                fetchInstallments();
            } else {
                alert('Gagal konfirmasi pembayaran');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(null);
        }
    };

    const filteredInstallments = filter === 'all'
        ? installments
        : installments.filter(i => i.status === filter);

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
            UNPAID: 'bg-yellow-500/20 text-yellow-400',
            PAID: 'bg-green-500/20 text-green-400',
            OVERDUE: 'bg-red-500/20 text-red-400',
        };
        const labels: Record<string, string> = {
            UNPAID: 'Belum Bayar',
            PAID: 'Lunas',
            OVERDUE: 'Terlambat',
        };
        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status]}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Stats
    const totalUnpaid = installments.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.amount, 0);
    const totalPaid = installments.filter(i => i.status === 'PAID').reduce((s, i) => s + i.paidAmount, 0);

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
                <h1 className="text-2xl font-bold text-white">Semua Cicilan</h1>
                <p className="text-slate-400 text-sm mt-1">Kelola pembayaran cicilan dari semua user</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Total Piutang</p>
                    <p className="text-xl font-bold text-yellow-400">{formatCurrency(totalUnpaid)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Total Diterima</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Belum Bayar</p>
                    <p className="text-xl font-bold text-white">{installments.filter(i => i.status === 'UNPAID').length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-slate-400 text-sm">Sudah Bayar</p>
                    <p className="text-xl font-bold text-white">{installments.filter(i => i.status === 'PAID').length}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['UNPAID', 'PAID', 'OVERDUE', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status === 'all' ? 'Semua' : status === 'UNPAID' ? 'Belum Bayar' : status === 'PAID' ? 'Lunas' : 'Terlambat'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-700/30">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">User</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Barang</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Cicilan</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Jumlah</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Jatuh Tempo</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredInstallments.map((inst) => (
                            <tr key={inst.id} className="hover:bg-slate-700/20">
                                <td className="px-4 py-3">
                                    <p className="text-white">{inst.application.user.name}</p>
                                    <p className="text-xs text-slate-500">{inst.application.user.phone}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-white">{inst.application.item.name}</p>
                                    <p className="text-xs text-slate-500">{inst.application.applicationNo}</p>
                                </td>
                                <td className="px-4 py-3 text-white">Ke-{inst.installmentNo}</td>
                                <td className="px-4 py-3 text-white font-medium">{formatCurrency(inst.amount)}</td>
                                <td className="px-4 py-3 text-slate-300">{formatDate(inst.dueDate)}</td>
                                <td className="px-4 py-3">{getStatusBadge(inst.status)}</td>
                                <td className="px-4 py-3">
                                    {inst.status === 'UNPAID' && (
                                        <button
                                            onClick={() => handleConfirmPayment(inst.id)}
                                            disabled={processing === inst.id}
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {processing === inst.id ? '...' : 'Konfirmasi Bayar'}
                                        </button>
                                    )}
                                    {inst.status === 'PAID' && inst.paidAt && (
                                        <span className="text-xs text-slate-500">
                                            {formatDate(inst.paidAt)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
