'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ItemRequest {
    id: string;
    itemName: string;
    description: string | null;
    imageUrl: string | null;
    quantity: number;
    maxPrice: number | null;
    status: string;
    adminNotes: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
    };
}

export default function OwnerRequestsPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<ItemRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/owner/requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id: string, status: string, adminNotes?: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/owner/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes }),
            });

            if (res.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus request ini?')) return;

        setActionLoading(id);
        try {
            const res = await fetch(`/api/owner/requests/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string): React.CSSProperties => {
        const colors: Record<string, React.CSSProperties> = {
            PENDING: { background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' },
            APPROVED: { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' },
            REJECTED: { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' },
            FULFILLED: { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' },
        };
        return colors[status] || { background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' };
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Menunggu',
            APPROVED: 'Disetujui',
            REJECTED: 'Ditolak',
            FULFILLED: 'Terpenuhi',
        };
        return labels[status] || status;
    };

    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/owner"
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1 mb-4"
                >
                    ← Kembali ke Dashboard
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Request Barang dari User</h1>
                        <p className="text-slate-400 mt-2">Kelola permintaan barang baru dari customer</p>
                    </div>
                    {pendingCount > 0 && (
                        <span className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            {pendingCount} menunggu
                        </span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-400">Belum ada request dari user</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/30">
                                <tr>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Gambar</th>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Tanggal</th>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">User</th>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Nama Barang</th>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Deskripsi</th>
                                    <th className="text-center text-slate-400 text-sm font-medium px-6 py-4">Qty</th>
                                    <th className="text-right text-slate-400 text-sm font-medium px-6 py-4">Harga Max</th>
                                    <th className="text-center text-slate-400 text-sm font-medium px-6 py-4">Status</th>
                                    <th className="text-center text-slate-400 text-sm font-medium px-6 py-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4">
                                            {req.imageUrl ? (
                                                <img
                                                    src={req.imageUrl}
                                                    alt={req.itemName}
                                                    className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {formatDate(req.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{req.user.name}</div>
                                            <div className="text-sm text-slate-400">{req.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{req.itemName}</td>
                                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                                            {req.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-300">{req.quantity}</td>
                                        <td className="px-6 py-4 text-right text-slate-300">
                                            {req.maxPrice ? formatCurrency(req.maxPrice) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '9999px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    display: 'inline-block',
                                                    ...getStatusBadge(req.status),
                                                }}
                                            >
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                                            disabled={actionLoading === req.id}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                                            disabled={actionLoading === req.id}
                                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'FULFILLED')}
                                                        disabled={actionLoading === req.id}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        ✓ Fulfilled
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(req.id)}
                                                    disabled={actionLoading === req.id}
                                                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
