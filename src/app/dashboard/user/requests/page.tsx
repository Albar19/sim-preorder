'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
}

export default function UserRequestsPage() {
    const { data: session } = useSession();
    const [requests, setRequests] = useState<ItemRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    // Form state
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [maxPrice, setMaxPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.imageUrl);
            } else {
                const data = await res.json();
                setMessage(data.error || 'Gagal upload gambar');
                setImagePreview('');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('Gagal upload gambar');
            setImagePreview('');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImageUrl('');
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const res = await fetch('/api/user/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemName,
                    description,
                    quantity,
                    maxPrice: maxPrice || null,
                    imageUrl: imageUrl || null,
                }),
            });

            if (res.ok) {
                setMessage('Request berhasil dikirim!');
                setItemName('');
                setDescription('');
                setQuantity(1);
                setMaxPrice('');
                setImageUrl('');
                setImagePreview('');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                fetchRequests();
            } else {
                const data = await res.json();
                setMessage(data.error || 'Gagal mengirim request');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/user"
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1 mb-4"
                >
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white">Request Barang Baru</h1>
                <p className="text-slate-400 mt-2">
                    Ajukan barang yang ingin Anda pre-order tetapi belum tersedia di katalog
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Form Request</h2>
                        <p className="text-sm text-slate-400">Isi detail barang yang ingin Anda ajukan</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nama Barang <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            required
                            placeholder="Contoh: iPhone 16 Pro, Samsung Galaxy S24, dll."
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Deskripsi / Spesifikasi
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Warna, ukuran, varian, kapasitas, atau spesifikasi lainnya..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Gambar Produk (Opsional)
                        </label>

                        <div className="flex items-start gap-4">
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm text-slate-400
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-purple-600 file:text-white
                                        hover:file:bg-purple-700
                                        file:cursor-pointer
                                        cursor-pointer"
                                />
                                <p className="text-xs text-slate-500">PNG, JPG, GIF, WebP (Max 5MB)</p>
                            </div>

                            {imagePreview && (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-24 h-24 object-cover rounded-lg border border-slate-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                    >
                                        ×
                                    </button>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-slate-900/70 rounded-lg flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Jumlah
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Harga Maksimal (Rp)
                            </label>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder="Opsional - budget maksimal Anda"
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {message && (
                        <div
                            className={`p-4 rounded-xl border ${message.includes('berhasil')
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || uploading}
                        className={`w-full md:w-auto px-8 py-3 rounded-xl font-semibold text-white transition-all ${submitting || uploading
                            ? 'bg-slate-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25'
                            }`}
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Mengirim...
                            </span>
                        ) : (
                            '🚀 Kirim Request'
                        )}
                    </button>
                </form>
            </div>

            {/* Request List */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">Daftar Request Anda</h2>
                    <p className="text-sm text-slate-400 mt-1">Pantau status request yang sudah diajukan</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-400">Belum ada request</p>
                        <p className="text-slate-500 text-sm mt-1">Ajukan request pertama Anda menggunakan form di atas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/30">
                                <tr>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Gambar</th>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Nama Barang</th>
                                    <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Deskripsi</th>
                                    <th className="text-center text-slate-400 text-sm font-medium px-6 py-4">Qty</th>
                                    <th className="text-right text-slate-400 text-sm font-medium px-6 py-4">Harga Max</th>
                                    <th className="text-center text-slate-400 text-sm font-medium px-6 py-4">Status</th>
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
