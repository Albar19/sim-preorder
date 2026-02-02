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
    paymentProof: string | null;
    confirmedAt: string | null;
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
    const [filter, setFilter] = useState('PENDING_VERIFICATION');
    const [confirming, setConfirming] = useState<string | null>(null);
    const [proofModal, setProofModal] = useState<{ show: boolean; installment: Installment | null }>({ show: false, installment: null });

    useEffect(() => {
        fetchInstallments();
    }, []);

    const fetchInstallments = async () => {
        try {
            const res = await fetch('/api/installments/all');
            if (res.ok) {
                const data = await res.json();
                setInstallments(data);
            }
        } catch (error) {
            console.error('Error fetching installments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        if (!confirm('Konfirmasi pembayaran cicilan ini?')) return;
        setConfirming(id);
        try {
            const res = await fetch(`/api/installments/${id}/pay`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchInstallments();
                setProofModal({ show: false, installment: null });
                alert('Pembayaran berhasil dikonfirmasi!');
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal konfirmasi pembayaran');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        } finally {
            setConfirming(null);
        }
    };

    const handleRejectProof = async (id: string) => {
        const reason = prompt('Alasan penolakan bukti transfer:');
        if (!reason) return;

        setConfirming(id);
        try {
            const res = await fetch(`/api/installments/${id}/reject-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                fetchInstallments();
                setProofModal({ show: false, installment: null });
                alert('Bukti transfer ditolak. User akan diberitahu.');
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menolak bukti');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        } finally {
            setConfirming(null);
        }
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
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            UNPAID: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            PENDING_VERIFICATION: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
            OVERDUE: 'bg-red-500/20 text-red-400 border border-red-500/30',
        };
        const labels: Record<string, string> = {
            UNPAID: 'Belum Bayar',
            PENDING_VERIFICATION: 'Perlu Verifikasi',
            PAID: 'Lunas',
            OVERDUE: 'Terlambat',
        };
        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || 'bg-slate-500/20 text-slate-400'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredInstallments = filter === 'all'
        ? installments
        : installments.filter(i => i.status === filter);

    // Count pending verifications
    const pendingCount = installments.filter(i => i.status === 'PENDING_VERIFICATION').length;

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
                <h1 className="text-2xl font-bold text-white">Cicilan User</h1>
                <p className="text-slate-400 text-sm mt-1">Kelola dan verifikasi pembayaran cicilan</p>
            </div>

            {/* Alert for pending verifications */}
            {pendingCount > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                        <p className="text-blue-400 font-medium">{pendingCount} bukti transfer menunggu verifikasi</p>
                        <p className="text-slate-400 text-sm">Klik pada cicilan untuk melihat dan verifikasi bukti transfer</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'PENDING_VERIFICATION', label: `Perlu Verifikasi ${pendingCount > 0 ? `(${pendingCount})` : ''}` },
                    { key: 'UNPAID', label: 'Belum Bayar' },
                    { key: 'PAID', label: 'Lunas' },
                    { key: 'OVERDUE', label: 'Terlambat' },
                    { key: 'all', label: 'Semua' },
                ].map((status) => (
                    <button
                        key={status.key}
                        onClick={() => setFilter(status.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === status.key
                            ? status.key === 'PENDING_VERIFICATION' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            {filteredInstallments.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
                    <p className="text-slate-400">Tidak ada data</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">User</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Barang</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Cicilan</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Jumlah</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Jatuh Tempo</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredInstallments.map((inst) => (
                                <tr key={inst.id} className={`hover:bg-slate-700/20 ${inst.status === 'PENDING_VERIFICATION' ? 'bg-blue-500/5' : ''}`}>
                                    <td className="px-4 py-3">
                                        <p className="text-white font-medium">{inst.application.user.name}</p>
                                        <p className="text-xs text-slate-500">{inst.application.user.phone || '-'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-white">{inst.application.item.name}</p>
                                        <p className="text-xs text-slate-500">{inst.application.applicationNo}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center text-white">ke-{inst.installmentNo}</td>
                                    <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(inst.amount)}</td>
                                    <td className="px-4 py-3 text-slate-300">{formatDate(inst.dueDate)}</td>
                                    <td className="px-4 py-3 text-center">{getStatusBadge(inst.status)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {inst.status === 'PENDING_VERIFICATION' && (
                                            <button
                                                onClick={() => setProofModal({ show: true, installment: inst })}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                                            >
                                                🔍 Lihat Bukti
                                            </button>
                                        )}
                                        {(inst.status === 'UNPAID' || inst.status === 'OVERDUE') && (
                                            <button
                                                onClick={() => handleConfirmPayment(inst.id)}
                                                disabled={confirming === inst.id}
                                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                ✓ Konfirmasi Manual
                                            </button>
                                        )}
                                        {inst.status === 'PAID' && inst.confirmedAt && (
                                            <span className="text-green-400 text-xs">✓ {formatDate(inst.confirmedAt)}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Proof Modal */}
            {proofModal.show && proofModal.installment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-white mb-4">🔍 Verifikasi Bukti Transfer</h3>

                        <div className="bg-slate-700/50 rounded-lg p-4 mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">User:</span>
                                <span className="text-white">{proofModal.installment.application.user.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Barang:</span>
                                <span className="text-white">{proofModal.installment.application.item.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Cicilan ke:</span>
                                <span className="text-white">{proofModal.installment.installmentNo}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-400">Jumlah:</span>
                                <span className="text-purple-400">{formatCurrency(proofModal.installment.amount)}</span>
                            </div>
                        </div>

                        {proofModal.installment.paymentProof ? (
                            <div className="mb-4">
                                <p className="text-slate-400 text-sm mb-2">Bukti Transfer:</p>
                                <img
                                    src={proofModal.installment.paymentProof}
                                    alt="Bukti Transfer"
                                    className="w-full rounded-lg border border-slate-600"
                                />
                            </div>
                        ) : (
                            <div className="bg-slate-700/30 rounded-lg p-8 text-center mb-4">
                                <p className="text-slate-400">Tidak ada bukti transfer</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setProofModal({ show: false, installment: null })}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => handleRejectProof(proofModal.installment!.id)}
                                disabled={confirming !== null}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                ✕ Tolak
                            </button>
                            <button
                                onClick={() => handleConfirmPayment(proofModal.installment!.id)}
                                disabled={confirming !== null}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                ✓ Konfirmasi Lunas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
