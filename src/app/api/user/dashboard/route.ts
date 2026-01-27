import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get total orders
        const totalOrders = await prisma.order.count({
            where: { userId },
        });

        // Get pending orders (not completed or cancelled)
        const pendingOrders = await prisma.order.count({
            where: {
                userId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
        });

        // Get total debt (orders that are DELIVERED but not yet marked as paid - in this system all delivered = debt)
        const debtOrders = await prisma.order.findMany({
            where: {
                userId,
                status: { in: ['DELIVERED', 'COMPLETED'] },
            },
            select: { totalAmount: true },
        });
        const totalDebt = debtOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            totalOrders,
            pendingOrders,
            totalDebt,
            recentOrders,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
