'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Item {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
}

export default function ItemsCatalogPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ itemId: string; quantity: number }[]>([]);

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

    const addToCart = (itemId: string) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.itemId === itemId);
            if (existing) {
                return prev.map((c) =>
                    c.itemId === itemId ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { itemId, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => prev.filter((c) => c.itemId !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        setCart((prev) =>
            prev.map((c) => (c.itemId === itemId ? { ...c, quantity } : c))
        );
    };

    const getCartQuantity = (itemId: string) => {
        return cart.find((c) => c.itemId === itemId)?.quantity || 0;
    };

    const getTotalPrice = () => {
        return cart.reduce((sum, c) => {
            const item = items.find((i) => i.id === c.itemId);
            return sum + (item?.price || 0) * c.quantity;
        }, 0);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Katalog Barang 📦</h1>
                    <p className="text-slate-400 mt-2">Pilih barang untuk pre-order</p>
                </div>
                {cart.length > 0 && (
                    <Link
                        href={{
                            pathname: '/dashboard/user/orders/create',
                            query: { cart: JSON.stringify(cart) },
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Checkout ({cart.length})</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                            {formatCurrency(getTotalPrice())}
                        </span>
                    </Link>
                )}
            </div>

            {/* Items Grid */}
            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                        const cartQty = getCartQuantity(item.id);
                        return (
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
                                        {cartQty > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, cartQty - 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-white font-medium">{cartQty}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, cartQty + 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(item.id)}
                                                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                + Keranjang
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-slate-400 text-lg">Belum ada barang tersedia</p>
                </div>
            )}
        </div>
    );
}
