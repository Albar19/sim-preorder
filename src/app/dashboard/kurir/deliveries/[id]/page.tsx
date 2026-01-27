'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Delivery {
    id: string;
    status: string;
    notes: string | null;
    order: {
        orderNumber: string;
        totalAmount: number;
        notes: string | null;
        user: { name: string; phone: string | null; address: string | null };
        items: Array<{ id: string; quantity: number; price: number; item: { name: string } }>;
    };
}

const STATUS_OPTIONS = [
    { value: 'ASSIGNED', label: 'Ditugaskan', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: 'PICKED_UP', label: 'Diambil', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'ON_THE_WAY', label: 'Dalam Perjalanan', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { value: 'ARRIVED', label: 'Sampai Lokasi', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { value: 'DELIVERED', label: 'Diserahkan', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'CONFIRMED', label: 'Dikonfirmasi', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
];

export default function DeliveryDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchDelivery();
        }
    }, [params.id]);

    async function fetchDelivery() {
        try {
            const res = await fetch(`/api/kurir/deliveries/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setDelivery(data);
                setNotes(data.notes || '');
            }
        } catch (error) {
            console.error('Error fetching delivery:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/kurir/deliveries/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, notes }),
            });

            if (res.ok) {
                fetchDelivery();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusOption = (status: string) => {
        return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    };

    const getNextStatus = (currentStatus: string) => {
        const statusOrder = ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'DELIVERED', 'CONFIRMED'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        if (currentIndex < statusOrder.length - 1) {
            return statusOrder[currentIndex + 1];
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-400">Pengantaran tidak ditemukan</p>
                <Link href="/dashboard/kurir" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
                    ← Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    const nextStatus = getNextStatus(delivery.status);
    const currentStatusOption = getStatusOption(delivery.status);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/kurir"
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1 mb-4"
                >
                    ← Kembali ke Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white">Detail Pengantaran 🚚</h1>
                <p className="text-slate-400 mt-2">Order: {delivery.order.orderNumber}</p>
            </div>

            {/* Status Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Status Saat Ini</h2>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium border ${currentStatusOption.color}`}>
                        {currentStatusOption.label}
                    </span>
                </div>

                {/* Status Timeline */}
                <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
                    {STATUS_OPTIONS.map((status, index) => {
                        const isCompleted = STATUS_OPTIONS.findIndex(s => s.value === delivery.status) >= index;
                        return (
                            <div key={status.value} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isCompleted ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                {index < STATUS_OPTIONS.length - 1 && (
                                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-purple-600' : 'bg-slate-700'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {nextStatus && (
                    <button
                        onClick={() => handleStatusUpdate(nextStatus)}
                        disabled={updating}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                    >
                        {updating ? 'Memproses...' : `Update ke: ${getStatusOption(nextStatus).label}`}
                    </button>
                )}

                {!nextStatus && (
                    <div className="text-center py-4 text-green-400">
                        ✓ Pengantaran sudah selesai
                    </div>
                )}
            </div>

            {/* Customer Info */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Informasi Penerima</h2>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                            <p className="text-slate-400 text-sm">Nama</p>
                            <p className="text-white">{delivery.order.user.name}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                            <p className="text-slate-400 text-sm">Telepon</p>
                            <p className="text-white">{delivery.order.user.phone || '-'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                            <p className="text-slate-400 text-sm">Alamat</p>
                            <p className="text-white">{delivery.order.user.address || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Detail Barang</h2>
                <div className="space-y-3">
                    {delivery.order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-700/30 px-4 py-3 rounded-lg">
                            <span className="text-slate-300">{item.item.name} x {item.quantity}</span>
                            <span className="text-white font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <div className="border-t border-slate-700 pt-3 flex justify-between">
                        <span className="text-slate-400">Total</span>
                        <span className="text-xl font-bold text-purple-400">{formatCurrency(delivery.order.totalAmount)}</span>
                    </div>
                </div>
                {delivery.order.notes && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-sm">Catatan: {delivery.order.notes}</p>
                    </div>
                )}
            </div>

            {/* Delivery Notes */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Catatan Pengantaran</h2>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan (opsional)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
            </div>
        </div>
    );
}
