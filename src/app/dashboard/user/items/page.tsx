'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
}

export default function ItemsCatalogPage() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [tenor, setTenor] = useState(6);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchItems() {
            try {
                const res = await fetch('/api/items');
                if (res.ok) {
                    const data = await res.json();
                    setItems(data);
                }
            } catch (error) {
                console.error('Error fetching items:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchItems();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const openCreditModal = (item: Item) => {
        setSelectedItem(item);
        setQuantity(1);
        setTenor(6);
        setNotes('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!selectedItem) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/credit/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: selectedItem.id,
                    quantity,
                    tenor,
                    notes
                })
            });
            if (res.ok) {
                setShowModal(false);
                router.push('/dashboard/user/credits');
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal mengajukan kredit');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const totalPrice = selectedItem ? selectedItem.price * quantity : 0;
    const monthlyAmount = Math.ceil(totalPrice / tenor);

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
                <h1 className="text-3xl font-bold text-white">Katalog Barang 📦</h1>
                <p className="text-slate-400 mt-2">Pilih barang dan ajukan kredit</p>
            </div>

            {/* Items Grid */}
            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-purple-500/50 transition-all group"
                        >
                            <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                )}
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                                    {item.name}
                                </h3>
                                {item.description && (
                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <p className="text-xl font-bold text-white">{formatCurrency(item.price)}</p>
                                        <p className="text-xs text-slate-500">Stok: {item.stock}</p>
                                    </div>
                                    <button
                                        onClick={() => openCreditModal(item)}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                                    >
                                        Ajukan Kredit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-slate-400 text-lg">Belum ada barang tersedia</p>
                </div>
            )}

            {/* Credit Application Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Ajukan Kredit</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Item Preview */}
                        <div className="flex gap-4 p-4 bg-slate-700/30 rounded-xl mb-6">
                            <div className="w-20 h-20 bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                                {selectedItem.imageUrl ? (
                                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">{selectedItem.name}</h3>
                                <p className="text-purple-400 font-bold">{formatCurrency(selectedItem.price)}</p>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 text-center px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Metode Pembayaran</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[{ value: 1, label: 'Cash' }, { value: 3, label: '3 Bulan' }, { value: 6, label: '6 Bulan' }, { value: 12, label: '12 Bulan' }].map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTenor(t.value)}
                                        className={`py-3 rounded-lg text-center text-sm transition-all ${tenor === t.value
                                            ? t.value === 1 ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Catatan (opsional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Tambahkan catatan jika perlu..."
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={2}
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between text-slate-400 mb-2">
                                <span>Harga x {quantity}</span>
                                <span className="text-white">{formatCurrency(totalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 mb-2">
                                <span>Metode</span>
                                <span className="text-white">{tenor === 1 ? 'Cash (Bayar Langsung)' : `Cicilan ${tenor} bulan`}</span>
                            </div>
                            <div className="border-t border-slate-600 my-3"></div>
                            <div className="flex justify-between">
                                <span className="text-white font-semibold">{tenor === 1 ? 'Total Bayar' : 'Cicilan/bulan'}</span>
                                <span className={`font-bold text-xl ${tenor === 1 ? 'text-green-400' : 'text-purple-400'}`}>{formatCurrency(monthlyAmount)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Mengajukan...' : 'Ajukan Kredit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
