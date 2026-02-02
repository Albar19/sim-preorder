'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Item {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
}

interface Installment {
    id: string;
    installmentNo: number;
    amount: number;
    dueDate: string;
    status: string;
    paidAt: string | null;
}

interface CreditApplication {
    id: string;
    applicationNo: string;
    quantity: number;
    totalPrice: number;
    tenor: number;
    monthlyAmount: number;
    status: string;
    notes: string | null;
    adminNotes: string | null;
    createdAt: string;
    approvedAt: string | null;
    item: Item;
    installments: Installment[];
}

export default function CreditApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [application, setApplication] = useState<CreditApplication | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplication();
    }, [id]);

    const fetchApplication = async () => {
        try {
            const res = await fetch(`/api/credit/applications/${id}`);
            if (res.ok) {
                const data = await res.json();
                setApplication(data);
            } else {
                router.push('/dashboard/user/credits');
            }
        } catch (error) {
            console.error('Error fetching application:', error);
        } finally {
            setLoading(false);
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
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            APPROVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
            REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
            COMPLETED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        };
        const labels: Record<string, string> = {
            PENDING: 'Menunggu Persetujuan',
            APPROVED: 'Disetujui',
            REJECTED: 'Ditolak',
            COMPLETED: 'Lunas',
        };
        return (
            <span className={`px-3 py-1.5 rounded-xl text-sm font-medium ${styles[status] || 'bg-slate-500/20 text-slate-400'}`}>
                {labels[status] || status}
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

    if (!application) return null;

    // Generate estimated installments if PENDING
    const estimatedInstallments = application.status === 'PENDING' && application.tenor > 1 ? Array.from({ length: application.tenor }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i + 1);
        date.setDate(1);
        return {
            installmentNo: i + 1,
            dueDate: date.toISOString(),
            amount: application.monthlyAmount
        };
    }) : [];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/user/credits"
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1 mb-4"
                >
                    ← Kembali ke Daftar Pengajuan
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Detail Pengajuan Kredit</h1>
                        <p className="text-slate-400 mt-1">{application.applicationNo} • Diajukan pada {formatDate(application.createdAt)}</p>
                    </div>
                    {getStatusBadge(application.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Side: Item & Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="aspect-square bg-slate-700/50 flex items-center justify-center">
                            {application.item.imageUrl ? (
                                <img src={application.item.imageUrl} alt={application.item.name} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            )}
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-2">{application.item.name}</h2>
                            <p className="text-slate-400 text-sm line-clamp-3">{application.item.description || 'Tidak ada deskripsi'}</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            Informasi Pengajuan
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Jumlah Barang</span>
                                <span className="text-white">{application.quantity}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Harga Per Unit</span>
                                <span className="text-white">{formatCurrency(application.item.price)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-700 pt-3">
                                <span className="text-slate-400">Total Harga</span>
                                <span className="text-white font-bold">{formatCurrency(application.totalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Tenor Cicilan</span>
                                <span className="text-white">{application.tenor} Bulan</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-purple-400">Cicilan/Bulan</span>
                                <span className="text-purple-400 font-bold">{formatCurrency(application.monthlyAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Schedule */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                        <h3 className="text-white font-semibold mb-6 flex items-center justify-between">
                            Jadwal Pembayaran
                            {application.status === 'PENDING' && (
                                <span className="text-xs font-normal text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                                    Estimasi
                                </span>
                            )}
                        </h3>

                        <div className="space-y-4">
                            {(application.installments.length > 0 ? application.installments : estimatedInstallments).map((inst, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                                            {inst.installmentNo}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Cicilan ke-{inst.installmentNo}</p>
                                            <p className="text-xs text-slate-400">Jatuh Tempo: {formatDate(inst.dueDate)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{formatCurrency(inst.amount)}</p>
                                        {'status' in inst && (
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${inst.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                                    inst.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {inst.status === 'PAID' ? 'Lunas' : inst.status === 'OVERDUE' ? 'Terlambat' : 'Belum Bayar'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {application.tenor === 1 && (
                                <div className="text-center py-8">
                                    <p className="text-green-400 font-medium">✨ Pembayaran Cash / Lunas</p>
                                    <p className="text-slate-400 text-sm mt-1">Status akan diupdate oleh Owner setelah pembayaran diterima.</p>
                                </div>
                            )}

                            {application.status === 'PENDING' && application.tenor > 1 && (
                                <p className="text-xs text-slate-500 mt-4 italic text-center">
                                    * Jadwal di atas adalah estimasi. Tanggal pasti akan dibuat setelah pengajuan disetujui.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {(application.notes || application.adminNotes) && (
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-4">
                            {application.notes && (
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Catatan Anda</p>
                                    <p className="text-slate-300 text-sm">{application.notes}</p>
                                </div>
                            )}
                            {application.adminNotes && (
                                <div className="pt-4 border-t border-slate-700/50">
                                    <p className="text-xs text-purple-400 font-bold uppercase mb-1">Catatan Owner</p>
                                    <p className="text-slate-300 text-sm">{application.adminNotes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
