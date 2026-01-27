import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total users (excluding owners)
        const totalUsers = await prisma.user.count({
            where: { role: { in: ['USER', 'KURIR'] } },
        });

        // Get total orders
        const totalOrders = await prisma.order.count();

        // Get pending orders
        const pendingOrders = await prisma.order.count({
            where: { status: 'PENDING' },
        });

        // Get active deliveries
        const activeDeliveries = await prisma.delivery.count({
            where: { status: { notIn: ['DELIVERED', 'CONFIRMED'] } },
        });

        // Get total revenue (all orders)
        const allOrders = await prisma.order.findMany({
            select: { totalAmount: true },
        });
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Get total debt (orders delivered but system is SIM only - no payment tracking)
        // In this context, debt = total of orders that are DELIVERED or COMPLETED
        const debtOrders = await prisma.order.findMany({
            where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
            select: { totalAmount: true },
        });
        const totalDebt = debtOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { name: true } },
            },
        });

        return NextResponse.json({
            totalUsers,
            totalOrders,
            pendingOrders,
            activeDeliveries,
            totalRevenue,
            totalDebt,
            recentOrders,
        });
    } catch (error) {
        console.error('Owner dashboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
