'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
        item: {
            name: string;
        };
    };
}

export default function UserInstallmentsPage() {
    const router = useRouter();
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchInstallments();
    }, []);

    const fetchInstallments = async () => {
        try {
            const res = await fetch('/api/installments');
            const data = await res.json();
            setInstallments(data);
        } catch (error) {
            console.error('Error fetching installments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInstallments = filter === 'all'
        ? installments
        : installments.filter(i => i.status === filter);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            UNPAID: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
            OVERDUE: 'bg-red-500/20 text-red-400 border border-red-500/30',
        };
        const labels: Record<string, string> = {
            UNPAID: 'Belum Bayar',
            PAID: 'Lunas',
            OVERDUE: 'Terlambat',
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Calculate summary
    const totalUnpaid = installments
        .filter(i => i.status === 'UNPAID')
        .reduce((sum, i) => sum + i.amount, 0);
    const nextDue = installments
        .filter(i => i.status === 'UNPAID')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

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
            <div>
                <h1 className="text-2xl font-bold text-white">Cicilan Saya</h1>
                <p className="text-slate-400 text-sm mt-1">Kelola pembayaran cicilan kredit Anda</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                    <p className="text-slate-400 text-sm">Total Tagihan</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalUnpaid)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                    <p className="text-slate-400 text-sm">Cicilan Tersisa</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {installments.filter(i => i.status === 'UNPAID').length} cicilan
                    </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                    <p className="text-slate-400 text-sm">Jatuh Tempo Berikutnya</p>
                    <p className="text-lg font-bold text-purple-400 mt-1">
                        {nextDue ? formatDate(nextDue.dueDate) : '-'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['all', 'UNPAID', 'PAID', 'OVERDUE'].map((status) => (
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

            {/* Installments List */}
            {filteredInstallments.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
                    <p className="text-slate-400">Belum ada cicilan</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Barang</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Cicilan Ke</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Jumlah</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Jatuh Tempo</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredInstallments.map((inst) => (
                                <tr key={inst.id} className="hover:bg-slate-700/20">
                                    <td className="px-6 py-4">
                                        <p className="text-white font-medium">{inst.application.item.name}</p>
                                        <p className="text-xs text-slate-500">{inst.application.applicationNo}</p>
                                    </td>
                                    <td className="px-6 py-4 text-white">{inst.installmentNo}</td>
                                    <td className="px-6 py-4 text-white font-medium">{formatCurrency(inst.amount)}</td>
                                    <td className="px-6 py-4 text-slate-300">{formatDate(inst.dueDate)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(inst.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
