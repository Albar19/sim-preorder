'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

interface CartItem {
    itemId: string;
    quantity: number;
}

interface ItemDetails {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
}

function CheckoutContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [items, setItems] = useState<ItemDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [tenor, setTenor] = useState(6); // Default 6 bulan

    useEffect(() => {
        const cartData = searchParams.get('cart');
        if (cartData) {
            try {
                const parsedCart = JSON.parse(cartData);
                setCart(parsedCart);
                fetchItemDetails(parsedCart);
            } catch (err) {
                console.error('Failed to parse cart:', err);
                setError('Data keranjang tidak valid');
                setLoading(false);
            }
        } else {
            router.push('/dashboard/user/items');
        }
    }, [searchParams, router]);

    const fetchItemDetails = async (cartItems: CartItem[]) => {
        try {
            const res = await fetch('/api/items');
            if (res.ok) {
                const allItems: ItemDetails[] = await res.json();
                const filteredItems = allItems.filter(item =>
                    cartItems.some(c => c.itemId === item.id)
                );
                setItems(filteredItems);
            }
        } catch (err) {
            console.error('Error fetching items:', err);
            setError('Gagal memuat detail barang');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getTotalPrice = () => {
        return cart.reduce((sum, cartItem) => {
            const item = items.find(i => i.id === cartItem.itemId);
            return sum + (item?.price || 0) * cartItem.quantity;
        }, 0);
    };

    const monthlyAmount = Math.ceil(getTotalPrice() / tenor);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Submit each cart item as a separate credit application
            for (const cartItem of cart) {
                const item = items.find(i => i.id === cartItem.itemId);
                if (!item) continue;

                const res = await fetch('/api/credit/applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: cartItem.itemId,
                        quantity: cartItem.quantity,
                        tenor,
                        notes,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Gagal mengajukan kredit');
                }
            }

            router.push('/dashboard/user/credits');
            router.refresh();
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pesanan');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/user/items"
                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors inline-flex items-center gap-1 mb-4"
                >
                    ← Kembali ke Katalog
                </Link>
                <h1 className="text-3xl font-bold text-white">Checkout Kredit 🛍️</h1>
                <p className="text-slate-400 mt-2">Pilih metode pembayaran dan konfirmasi pesanan</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="p-6 border-b border-slate-700/50">
                            <h2 className="text-xl font-semibold text-white">Ringkasan Pesanan</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {cart.map((cartItem) => {
                                const item = items.find(i => i.id === cartItem.itemId);
                                return (
                                    <div key={cartItem.itemId} className="flex items-center gap-4 py-2">
                                        <div className="w-16 h-16 bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {item?.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-white font-medium">{item?.name || 'Loading...'}</h3>
                                            <p className="text-slate-400 text-sm">
                                                {formatCurrency(item?.price || 0)} x {cartItem.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold">
                                                {formatCurrency((item?.price || 0) * cartItem.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tempo/Metode Pembayaran */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Metode Pembayaran</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {[{ value: 1, label: 'Cash' }, { value: 3, label: '3 Bulan' }, { value: 6, label: '6 Bulan' }, { value: 12, label: '12 Bulan' }].map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setTenor(t.value)}
                                    className={`py-4 rounded-xl text-center font-medium transition-all ${tenor === t.value
                                        ? t.value === 1
                                            ? 'bg-green-600 text-white ring-2 ring-green-400'
                                            : 'bg-purple-600 text-white ring-2 ring-purple-400'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-slate-400 text-sm mt-4">
                            {tenor === 1
                                ? '💵 Bayar langsung tanpa cicilan'
                                : `📅 Cicilan ${tenor}x pembayaran (Estimasi jatuh tempo pertama: 1 ${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`
                            }
                        </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Catatan Tambahan</h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Titip di satpam, kirim setelah jam 5, dll."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                        />
                    </div>
                </div>

                {/* Checkout Action */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 sticky top-8">
                        <h2 className="text-xl font-semibold text-white mb-6">Total Pembayaran</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(getTotalPrice())}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Metode</span>
                                <span className="text-white">{tenor === 1 ? 'Cash' : `${tenor} Bulan`}</span>
                            </div>
                            <div className="border-t border-slate-700 pt-3 flex justify-between">
                                <span className="text-white font-semibold">
                                    {tenor === 1 ? 'Total Bayar' : 'Cicilan/bulan'}
                                </span>
                                <span className={`text-2xl font-bold ${tenor === 1 ? 'text-green-400' : 'text-purple-400'}`}>
                                    {formatCurrency(monthlyAmount)}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || cart.length === 0}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${submitting || cart.length === 0
                                ? 'bg-slate-600 cursor-not-allowed'
                                : tenor === 1
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 active:scale-[0.98]'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 active:scale-[0.98]'
                                }`}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                tenor === 1 ? 'Ajukan Pembelian Cash' : 'Ajukan Kredit'
                            )}
                        </button>

                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Pengajuan akan direview oleh Owner sebelum diproses.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
