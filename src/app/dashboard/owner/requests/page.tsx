'use client';

import { useEffect, useState } from 'react';

interface ItemRequest {
    id: string;
    itemName: string;
    description: string | null;
    imageUrl: string | null;
    quantity: number;
    maxPrice: number | null;
    ownerPrice: number | null;
    userAccepted: boolean | null;
    userTenor: number | null;
    applicationId: string | null;
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
    const [requests, setRequests] = useState<ItemRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');

    // Price Modal
    const [priceModal, setPriceModal] = useState<{ show: boolean; request: ItemRequest | null }>({ show: false, request: null });
    const [priceInput, setPriceInput] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

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

    const handleSetPrice = async () => {
        if (!priceModal.request) return;
        const price = parseFloat(priceInput);
        if (!price || price <= 0) {
            alert('Masukkan harga yang valid');
            return;
        }

        setActionLoading(priceModal.request.id);
        try {
            const res = await fetch(`/api/owner/requests/${priceModal.request.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SET_PRICE', ownerPrice: price, adminNotes }),
            });

            if (res.ok) {
                fetchRequests();
                setPriceModal({ show: false, request: null });
                setPriceInput('');
                setAdminNotes('');
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal set harga');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Alasan penolakan (opsional):');
        setActionLoading(id);
        try {
            const res = await fetch(`/api/owner/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REJECT', adminNotes: reason }),
            });

            if (res.ok) {
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menolak');
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
            const res = await fetch(`/api/owner/requests/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const openPriceModal = (req: ItemRequest) => {
        setPriceModal({ show: true, request: req });
        setPriceInput(req.maxPrice ? String(req.maxPrice) : '');
        setAdminNotes('');
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

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            PRICED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            USER_DECLINED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            FULFILLED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return styles[status] || 'bg-slate-500/20 text-slate-400';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Menunggu Harga',
            PRICED: 'Menunggu User',
            USER_DECLINED: 'User Tolak',
            FULFILLED: 'Selesai',
            REJECTED: 'Ditolak',
        };
        return labels[status] || status;
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
    const pricedCount = requests.filter((r) => r.status === 'PRICED').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Request Barang</h1>
                    <p className="text-slate-400 text-sm mt-1">Kelola permintaan barang dari user</p>
                </div>
                <div className="flex gap-2">
                    {pendingCount > 0 && (
                        <span className="px-3 py-1.5 rounded-lg text-sm bg-yellow-500/20 text-yellow-400">
                            {pendingCount} perlu harga
                        </span>
                    )}
                    {pricedCount > 0 && (
                        <span className="px-3 py-1.5 rounded-lg text-sm bg-purple-500/20 text-purple-400">
                            {pricedCount} menunggu user
                        </span>
                    )}
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'PENDING', 'PRICED', 'FULFILLED', 'USER_DECLINED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {status === 'all' ? 'Semua' : getStatusLabel(status)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">Tidak ada data</div>
                ) : (
                    <table className="w-full min-w-[1000px]">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Tanggal</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">User</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Barang</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Qty</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Budget Max</th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Harga Owner</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                                <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-700/20">
                                    <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(req.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-white">{req.user.name}</p>
                                        <p className="text-xs text-slate-500">{req.user.phone || req.user.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {req.imageUrl ? (
                                                <img src={req.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                                    <span className="text-slate-500">📦</span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-medium">{req.itemName}</p>
                                                <p className="text-xs text-slate-500 max-w-[200px] truncate">{req.description || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-300">{req.quantity}</td>
                                    <td className="px-4 py-3 text-right text-slate-400">
                                        {req.maxPrice ? formatCurrency(req.maxPrice) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {req.ownerPrice ? (
                                            <span className="text-purple-400 font-medium">{formatCurrency(req.ownerPrice)}</span>
                                        ) : (
                                            <span className="text-slate-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(req.status)}`}>
                                            {getStatusLabel(req.status)}
                                        </span>
                                        {req.userTenor && (
                                            <p className="text-xs text-slate-500 mt-1">Tenor: {req.userTenor === 1 ? 'Cash' : `${req.userTenor}bln`}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 justify-center flex-wrap">
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => openPriceModal(req)}
                                                        disabled={actionLoading === req.id}
                                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        💰 Set Harga
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        disabled={actionLoading === req.id}
                                                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'PRICED' && (
                                                <button
                                                    onClick={() => openPriceModal(req)}
                                                    disabled={actionLoading === req.id}
                                                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    ✎ Ubah Harga
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                disabled={actionLoading === req.id}
                                                className="px-2 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-500 disabled:opacity-50"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Price Modal */}
            {priceModal.show && priceModal.request && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-2">Set Harga</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            <strong>{priceModal.request.itemName}</strong> x{priceModal.request.quantity}
                            {priceModal.request.maxPrice && (
                                <span className="block mt-1">Budget user: {formatCurrency(priceModal.request.maxPrice)}</span>
                            )}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Harga per item (Rp)</label>
                                <input
                                    type="number"
                                    value={priceInput}
                                    onChange={(e) => setPriceInput(e.target.value)}
                                    placeholder="Masukkan harga..."
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                />
                                {priceInput && (
                                    <p className="text-sm text-purple-400 mt-1">
                                        Total: {formatCurrency(parseFloat(priceInput) * priceModal.request.quantity)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Catatan (opsional)</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Catatan untuk user..."
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setPriceModal({ show: false, request: null })}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSetPrice}
                                disabled={actionLoading !== null}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                Kirim Penawaran
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
