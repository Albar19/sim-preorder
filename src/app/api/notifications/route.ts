import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List notifikasi user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 });
    }
}

// PUT - Mark notifications sebagai read
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids } = body;

        if (ids && Array.isArray(ids)) {
            // Mark specific notifications
            await prisma.notification.updateMany({
                where: {
                    id: { in: ids },
                    userId: session.user.id
                },
                data: { isRead: true }
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId: session.user.id },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Gagal update notifikasi' }, { status: 500 });
    }
}
