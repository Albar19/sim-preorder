'use client';

import { useEffect, useState } from 'react';

interface DebtOrder {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

export default function UserDebtPage() {
    const [orders, setOrders] = useState<DebtOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalDebt, setTotalDebt] = useState(0);

    useEffect(() => {
        async function fetchDebt() {
            try {
                const res = await fetch('/api/user/debt');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders);
                    setTotalDebt(data.totalDebt);
                }
            } catch (error) {
                console.error('Error fetching debt:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchDebt();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Hutang / Tagihan 💰</h1>
                <p className="text-slate-400 mt-2">Ringkasan tagihan pre-order Anda</p>
            </div>

            {/* Total Debt Card */}
            <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-300 text-lg">Total Hutang</p>
                        <p className="text-4xl font-bold text-white mt-2">{formatCurrency(totalDebt)}</p>
                        <p className="text-slate-400 text-sm mt-2">
                            Dari {orders.length} order yang sudah diterima
                        </p>
                    </div>
                    <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-300 text-sm">
                    Sistem ini adalah Sistem Informasi Manajemen untuk pencatatan. Pembayaran dilakukan secara langsung kepada owner/penjual.
                </p>
            </div>

            {/* Debt Details */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">Rincian Tagihan</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Order</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Tanggal</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Status</th>
                                <th className="text-right text-slate-400 text-sm font-medium px-6 py-4">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(order.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                                                {order.status === 'DELIVERED' ? 'Terkirim' : 'Selesai'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white text-right font-medium">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        Tidak ada tagihan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {orders.length > 0 && (
                            <tfoot className="bg-slate-700/30">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-slate-300 font-medium">Total</td>
                                    <td className="px-6 py-4 text-white text-right font-bold text-lg">
                                        {formatCurrency(totalDebt)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
