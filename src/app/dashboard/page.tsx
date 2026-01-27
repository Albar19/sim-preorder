'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session?.user?.role) {
            const role = session.user.role.toLowerCase();
            router.replace(`/dashboard/${role}`);
        }
    }, [session, router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400">Mengalihkan ke dashboard Anda...</p>
            </div>
        </div>
    );
}
