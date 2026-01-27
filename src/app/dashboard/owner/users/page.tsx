'use client';

import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    createdAt: string;
    _count: { orders: number };
}

export default function OwnerUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/owner/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }

    const changeRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/owner/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error('Error changing role:', error);
        }
    };

    const deleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Yakin ingin menghapus user "${userName}"?`)) return;
        try {
            const res = await fetch(`/api/owner/users/${userId}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            KURIR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            USER: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        return styles[role] || 'bg-slate-500/20 text-slate-400';
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
            <div>
                <h1 className="text-3xl font-bold text-white">Kelola Users 👥</h1>
                <p className="text-slate-400 mt-2">Atur role dan kelola pengguna sistem</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30">
                            <tr>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Nama</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Email</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Role</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Orders</th>
                                <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white font-medium">{user.name}</p>
                                            {user.phone && <p className="text-slate-500 text-xs">{user.phone}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{user._count.orders}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={user.role}
                                                onChange={(e) => changeRole(user.id, e.target.value)}
                                                disabled={user.role === 'OWNER'}
                                                className="bg-slate-700 text-white text-sm rounded-lg px-2 py-1 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                            >
                                                <option value="USER">USER</option>
                                                <option value="KURIR">KURIR</option>
                                                <option value="OWNER">OWNER</option>
                                            </select>
                                            {user.role !== 'OWNER' && (
                                                <button
                                                    onClick={() => deleteUser(user.id, user.name)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Belum ada user
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
