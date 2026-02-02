'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    adminNotes: string | null;
    createdAt: string;
}

export default function OwnerCreditsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<CreditApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [processing, setProcessing] = useState<string | null>(null);

    // Reject Modal
    const [rejectModal, setRejectModal] = useState<{ id: string; show: boolean }>({ id: '', show: false });
    const [rejectReason, setRejectReason] = useState('');

    // Edit Modal
    const [editModal, setEditModal] = useState<{ app: CreditApplication | null; show: boolean }>({ app: null, show: false });
    const [editForm, setEditForm] = useState({ quantity: 1, tenor: 6, notes: '', adminNotes: '' });

    // Create Modal
    const [createModal, setCreateModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [createForm, setCreateForm] = useState({ userId: '', itemId: '', quantity: 1, tenor: 6, notes: '' });

    useEffect(() => {
        fetchApplications();
        fetchUsersAndItems();
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

    const fetchUsersAndItems = async () => {
        try {
            const [usersRes, itemsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/items')
            ]);
            if (usersRes.ok) setUsers(await usersRes.json());
            if (itemsRes.ok) setItems(await itemsRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const handleEdit = async () => {
        if (!editModal.app) return;
        setProcessing(editModal.app.id);
        try {
            const res = await fetch(`/api/credit/applications/${editModal.app.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                fetchApplications();
                setEditModal({ app: null, show: false });
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal mengupdate');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus pengajuan kredit ini? Data cicilan terkait juga akan dihapus.')) return;
        setProcessing(id);
        try {
            const res = await fetch(`/api/credit/applications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchApplications();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menghapus');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleCreate = async () => {
        if (!createForm.userId || !createForm.itemId) {
            alert('Pilih user dan barang');
            return;
        }
        setProcessing('create');
        try {
            // We need a special API for owner to create on behalf of user
            const res = await fetch('/api/credit/applications/create-for-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            });
            if (res.ok) {
                fetchApplications();
                setCreateModal(false);
                setCreateForm({ userId: '', itemId: '', quantity: 1, tenor: 6, notes: '' });
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal membuat pengajuan');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setProcessing(null);
        }
    };

    const openEditModal = (app: CreditApplication) => {
        setEditForm({
            quantity: app.quantity,
            tenor: app.tenor,
            notes: app.notes || '',
            adminNotes: app.adminNotes || ''
        });
        setEditModal({ app, show: true });
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
        const labels: Record<string, string> = {
            PENDING: 'Menunggu',
            APPROVED: 'Disetujui',
            REJECTED: 'Ditolak',
            COMPLETED: 'Lunas',
        };
        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status]}`}>
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Pengajuan Kredit</h1>
                    <p className="text-slate-400 text-sm mt-1">Kelola pengajuan kredit dari user</p>
                </div>
                <button
                    onClick={() => setCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                    + Buat Pengajuan Baru
                </button>
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
                    <p className="textxm-2xl font-bold text-green-400">
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
                        {status === 'all' ? 'Semua' : status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : status === 'COMPLETED' ? 'Lunas' : 'Ditolak'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[900px]">
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
                                <td className="px-4 py-3 text-white">{app.tenor === 1 ? 'Cash' : `${app.tenor} bln`}</td>
                                <td className="px-4 py-3 text-purple-400 font-medium">{formatCurrency(app.monthlyAmount)}</td>
                                <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        {app.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={processing === app.id}
                                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ id: app.id, show: true })}
                                                    disabled={processing === app.id}
                                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    ✕
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(app)}
                                                    disabled={processing === app.id}
                                                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    ✎
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(app.id)}
                                            disabled={processing === app.id}
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
                {filteredApps.length === 0 && (
                    <div className="p-8 text-center text-slate-400">Tidak ada data</div>
                )}
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

            {/* Edit Modal */}
            {editModal.show && editModal.app && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-4">Edit Pengajuan</h3>
                        <p className="text-slate-400 text-sm mb-4">{editModal.app.applicationNo} - {editModal.app.item.name}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Jumlah</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tenor</label>
                                <select
                                    value={editForm.tenor}
                                    onChange={(e) => setEditForm({ ...editForm, tenor: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value={1}>Cash</option>
                                    <option value={3}>3 Bulan</option>
                                    <option value={6}>6 Bulan</option>
                                    <option value={12}>12 Bulan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Catatan User</label>
                                <textarea
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white resize-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Catatan Admin</label>
                                <textarea
                                    value={editForm.adminNotes}
                                    onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditModal({ app: null, show: false })}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={processing !== null}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {createModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-white mb-4">Buat Pengajuan Baru</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Pilih User</label>
                                <select
                                    value={createForm.userId}
                                    onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value="">-- Pilih User --</option>
                                    {users.filter((u: { id: string; name: string; email: string; role?: string }) => u.role === 'USER').map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Pilih Barang</label>
                                <select
                                    value={createForm.itemId}
                                    onChange={(e) => setCreateForm({ ...createForm, itemId: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name} - {formatCurrency(item.price)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Jumlah</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={createForm.quantity}
                                    onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tenor</label>
                                <select
                                    value={createForm.tenor}
                                    onChange={(e) => setCreateForm({ ...createForm, tenor: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value={1}>Cash</option>
                                    <option value={3}>3 Bulan</option>
                                    <option value={6}>6 Bulan</option>
                                    <option value={12}>12 Bulan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Catatan</label>
                                <textarea
                                    value={createForm.notes}
                                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setCreateModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={processing === 'create'}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                Buat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
