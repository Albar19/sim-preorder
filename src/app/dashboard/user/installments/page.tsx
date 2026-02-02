'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Installment {
    id: string;
    installmentNo: number;
    amount: number;
    dueDate: string;
    paidAmount: number;
    paidAt: string | null;
    status: string;
    paymentProof: string | null;
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
    const [uploading, setUploading] = useState<string | null>(null);
    const [uploadModal, setUploadModal] = useState<{ show: boolean; installment: Installment | null }>({ show: false, installment: null });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = (file: File) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCloseModal = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setUploadModal({ show: false, installment: null });
        setPreviewUrl(null);
        setSelectedFile(null);
    };

    const handleUploadProof = async () => {
        if (!selectedFile || !uploadModal.installment) return;

        setUploading(uploadModal.installment.id);
        try {
            const formData = new FormData();
            formData.append('proof', selectedFile);

            const res = await fetch(`/api/installments/${uploadModal.installment.id}/upload-proof`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                alert('Bukti transfer berhasil diupload! Menunggu verifikasi owner.');
                fetchInstallments();
                handleCloseModal();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal mengupload bukti transfer');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        } finally {
            setUploading(null);
        }
    };

    const filteredInstallments = filter === 'all'
        ? installments
        : installments.filter(i => i.status === filter);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            UNPAID: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            PENDING_VERIFICATION: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            PAID: 'bg-green-500/20 text-green-400 border border-green-500/30',
            OVERDUE: 'bg-red-500/20 text-red-400 border border-red-500/30',
        };
        const labels: Record<string, string> = {
            UNPAID: 'Belum Bayar',
            PENDING_VERIFICATION: 'Menunggu Verifikasi',
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
        .filter(i => i.status === 'UNPAID' || i.status === 'PENDING_VERIFICATION')
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
                        {installments.filter(i => i.status !== 'PAID').length} cicilan
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
            <div className="flex gap-2 flex-wrap">
                {['all', 'UNPAID', 'PENDING_VERIFICATION', 'PAID', 'OVERDUE'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status === 'all' ? 'Semua' : status === 'UNPAID' ? 'Belum Bayar' : status === 'PENDING_VERIFICATION' ? 'Menunggu Verifikasi' : status === 'PAID' ? 'Lunas' : 'Terlambat'}
                    </button>
                ))}
            </div>

            {/* Installments List */}
            {filteredInstallments.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
                    <p className="text-slate-400">Belum ada cicilan</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Barang</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Cicilan Ke</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Jumlah</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Jatuh Tempo</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredInstallments.map((inst) => (
                                <tr key={inst.id} className="hover:bg-slate-700/20">
                                    <td className="px-4 py-3">
                                        <p className="text-white font-medium">{inst.application.item.name}</p>
                                        <p className="text-xs text-slate-500">{inst.application.applicationNo}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center text-white">{inst.installmentNo}</td>
                                    <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(inst.amount)}</td>
                                    <td className="px-4 py-3 text-slate-300">{formatDate(inst.dueDate)}</td>
                                    <td className="px-4 py-3 text-center">{getStatusBadge(inst.status)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {inst.status === 'UNPAID' && (
                                            <button
                                                onClick={() => setUploadModal({ show: true, installment: inst })}
                                                disabled={uploading === inst.id}
                                                className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                📤 Upload Bukti
                                            </button>
                                        )}
                                        {inst.status === 'PENDING_VERIFICATION' && (
                                            <span className="text-blue-400 text-xs">⏳ Menunggu verifikasi</span>
                                        )}
                                        {inst.status === 'PAID' && inst.paidAt && (
                                            <span className="text-green-400 text-xs">✓ {formatDate(inst.paidAt)}</span>
                                        )}
                                        {inst.status === 'OVERDUE' && (
                                            <button
                                                onClick={() => setUploadModal({ show: true, installment: inst })}
                                                disabled={uploading === inst.id}
                                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                                            >
                                                📤 Upload Bukti
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            {uploadModal.show && uploadModal.installment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-white mb-2">📤 Upload Bukti Transfer</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Cicilan ke-{uploadModal.installment.installmentNo}: <strong className="text-white">{formatCurrency(uploadModal.installment.amount)}</strong>
                        </p>

                        <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                            <p className="text-xs text-slate-400 mb-2">Transfer ke:</p>
                            <p className="text-white font-medium">Bank BCA</p>
                            <p className="text-purple-400 font-bold">1234567890</p>
                            <p className="text-slate-400 text-sm">a.n. Toko Kredit</p>
                        </div>

                        {/* Preview Image */}
                        {previewUrl && (
                            <div className="mb-4">
                                <p className="text-xs text-slate-400 mb-1">Preview Bukti:</p>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full rounded-lg border border-slate-600 object-contain max-h-[300px]"
                                />
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleFileSelect(file);
                                }
                            }}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            {!selectedFile ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Pilih File
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
                                    >
                                        Ganti
                                    </button>
                                    <button
                                        onClick={handleUploadProof}
                                        disabled={uploading !== null}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {uploading ? 'Mengupload...' : 'Upload'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
