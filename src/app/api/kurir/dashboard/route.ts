import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'KURIR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const kurirId = session.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get assigned deliveries
        const assigned = await prisma.delivery.count({
            where: {
                kurirId,
                status: 'ASSIGNED',
            },
        });

        // Get in-progress deliveries
        const inProgress = await prisma.delivery.count({
            where: {
                kurirId,
                status: { in: ['PICKED_UP', 'ON_THE_WAY', 'ARRIVED'] },
            },
        });

        // Get completed today
        const completed = await prisma.delivery.count({
            where: {
                kurirId,
                status: { in: ['DELIVERED', 'CONFIRMED'] },
                updatedAt: { gte: today },
            },
        });

        // Get pending deliveries (not completed)
        const pendingDeliveries = await prisma.delivery.findMany({
            where: {
                kurirId,
                status: { notIn: ['DELIVERED', 'CONFIRMED'] },
            },
            orderBy: { createdAt: 'asc' },
            include: {
                order: {
                    include: {
                        user: {
                            select: { name: true, address: true, phone: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            assigned,
            inProgress,
            completed,
            pendingDeliveries,
        });
    } catch (error) {
        console.error('Kurir dashboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
