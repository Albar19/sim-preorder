import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all users (Owner only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }
}
