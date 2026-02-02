'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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
}

export default function UserRequestsPage() {
    const [requests, setRequests] = useState<ItemRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form state
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [maxPrice, setMaxPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Accept Modal
    const [acceptModal, setAcceptModal] = useState<{ show: boolean; request: ItemRequest | null }>({ show: false, request: null });
    const [selectedTenor, setSelectedTenor] = useState(6);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/user/requests');
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.imageUrl);
            } else {
                setMessage('Gagal upload gambar');
                setImagePreview('');
            }
        } catch {
            setMessage('Gagal upload gambar');
            setImagePreview('');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImageUrl('');
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const res = await fetch('/api/user/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemName, description, quantity, maxPrice: maxPrice || null, imageUrl: imageUrl || null }),
            });

            if (res.ok) {
                setMessage('Request berhasil dikirim!');
                setItemName('');
                setDescription('');
                setQuantity(1);
                setMaxPrice('');
                setImageUrl('');
                setImagePreview('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchRequests();
            } else {
                const data = await res.json();
                setMessage(data.error || 'Gagal mengirim request');
            }
        } catch {
            setMessage('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async () => {
        if (!acceptModal.request) return;
        setActionLoading(acceptModal.request.id);
        try {
            const res = await fetch(`/api/user/requests/${acceptModal.request.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ACCEPT', tenor: selectedTenor }),
            });

            if (res.ok) {
                fetchRequests();
                setAcceptModal({ show: false, request: null });
                setMessage('Pengajuan kredit berhasil dibuat! Cek menu Pengajuan Kredit.');
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menerima penawaran');
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (id: string) => {
        if (!confirm('Tolak penawaran harga ini?')) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/user/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DECLINE' }),
            });

            if (res.ok) {
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menolak');
            }
        } catch {
            alert('Terjadi kesalahan');
        } finally {
            setActionLoading(null);
        }
    };

    const openAcceptModal = (req: ItemRequest) => {
        setAcceptModal({ show: true, request: req });
        setSelectedTenor(6);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400',
            PRICED: 'bg-purple-500/20 text-purple-400',
            USER_DECLINED: 'bg-orange-500/20 text-orange-400',
            FULFILLED: 'bg-green-500/20 text-green-400',
            REJECTED: 'bg-red-500/20 text-red-400',
        };
        return styles[status] || 'bg-slate-500/20 text-slate-400';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: 'Menunggu Harga',
            PRICED: 'Ada Penawaran!',
            USER_DECLINED: 'Anda Tolak',
            FULFILLED: 'Selesai',
            REJECTED: 'Ditolak Owner',
        };
        return labels[status] || status;
    };

    const pricedRequests = requests.filter(r => r.status === 'PRICED');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link href="/dashboard/user" className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-flex items-center gap-1">
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white">Request Barang</h1>
                <p className="text-slate-400 mt-2">Ajukan barang yang tidak ada di katalog</p>
            </div>

            {/* Notification: There are priced offers */}
            {pricedRequests.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-400 font-medium">🔔 Ada {pricedRequests.length} penawaran harga menunggu respon Anda!</p>
                </div>
            )}

            {/* Form Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                        <span className="text-white">📦</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Form Request</h2>
                        <p className="text-sm text-slate-400">Isi detail barang yang ingin Anda ajukan</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nama Barang <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            required
                            placeholder="Contoh: iPhone 16 Pro, Samsung Galaxy S24, dll."
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi / Spesifikasi</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Warna, ukuran, varian, kapasitas..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Gambar Produk (Opsional)</label>
                        <div className="flex items-start gap-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
                            />
                            {imagePreview && (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-slate-600" />
                                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
                                    {uploading && <div className="absolute inset-0 bg-slate-900/70 rounded-lg flex items-center justify-center"><div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Budget Maksimal (Rp)</label>
                            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Opsional - budget maksimal" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500" />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl border ${message.includes('berhasil') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {message}
                        </div>
                    )}

                    <button type="submit" disabled={submitting || uploading} className={`w-full md:w-auto px-8 py-3 rounded-xl font-semibold text-white transition-all ${submitting || uploading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}`}>
                        {submitting ? 'Mengirim...' : '🚀 Kirim Request'}
                    </button>
                </form>
            </div>

            {/* Request List */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">Daftar Request Anda</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">Belum ada request</div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {requests.map((req) => (
                            <div key={req.id} className="p-4 md:p-6 hover:bg-slate-700/20">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                        {req.imageUrl ? (
                                            <img src={req.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">📦</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-white font-medium">{req.itemName}</h3>
                                            <span className={`px-2 py-0.5 rounded-lg text-xs ${getStatusBadge(req.status)}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">x{req.quantity} {req.description && `• ${req.description}`}</p>
                                        {req.maxPrice && <p className="text-sm text-slate-500">Budget: {formatCurrency(req.maxPrice)}</p>}

                                        {/* Price offer from owner */}
                                        {req.status === 'PRICED' && req.ownerPrice && (
                                            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                                <p className="text-purple-400 font-medium">💰 Penawaran Harga:</p>
                                                <p className="text-white text-lg font-bold">{formatCurrency(req.ownerPrice)} <span className="text-sm font-normal text-slate-400">x{req.quantity}</span></p>
                                                <p className="text-sm text-purple-300">Total: {formatCurrency(req.ownerPrice * req.quantity)}</p>
                                                {req.adminNotes && <p className="text-sm text-slate-400 mt-1">📝 {req.adminNotes}</p>}
                                            </div>
                                        )}

                                        {/* Fulfilled info */}
                                        {req.status === 'FULFILLED' && req.userTenor && (
                                            <div className="mt-2 text-sm text-green-400">
                                                ✅ Disetujui • Tenor: {req.userTenor === 1 ? 'Cash' : `${req.userTenor} bulan`}
                                                <Link href="/dashboard/user/credits" className="ml-2 underline hover:text-green-300">Lihat Pengajuan →</Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {req.status === 'PRICED' && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => openAcceptModal(req)}
                                                disabled={actionLoading === req.id}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                                            >
                                                ✓ Terima
                                            </button>
                                            <button
                                                onClick={() => handleDecline(req.id)}
                                                disabled={actionLoading === req.id}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                            >
                                                ✕ Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Accept Modal with Tenor Selection */}
            {acceptModal.show && acceptModal.request && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-2">Terima Penawaran</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            <strong>{acceptModal.request.itemName}</strong> x{acceptModal.request.quantity}
                        </p>

                        <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                            <p className="text-slate-400 text-sm">Total Harga:</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(acceptModal.request.ownerPrice! * acceptModal.request.quantity)}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-2">Pilih Metode Pembayaran:</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 1, label: 'Cash', desc: 'Bayar langsung' },
                                    { value: 3, label: '3 Bulan', desc: '' },
                                    { value: 6, label: '6 Bulan', desc: '' },
                                    { value: 12, label: '12 Bulan', desc: '' },
                                ].map((opt) => {
                                    const total = acceptModal.request!.ownerPrice! * acceptModal.request!.quantity;
                                    const monthly = Math.ceil(total / opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSelectedTenor(opt.value)}
                                            className={`p-3 rounded-lg border text-left transition-all ${selectedTenor === opt.value
                                                    ? 'border-purple-500 bg-purple-500/20'
                                                    : 'border-slate-600 hover:border-slate-500'
                                                }`}
                                        >
                                            <p className="text-white font-medium">{opt.label}</p>
                                            <p className="text-sm text-purple-400">{formatCurrency(monthly)}{opt.value > 1 && '/bln'}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setAcceptModal({ show: false, request: null })} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                                Batal
                            </button>
                            <button onClick={handleAccept} disabled={actionLoading !== null} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                Konfirmasi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
