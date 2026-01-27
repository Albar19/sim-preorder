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

        // Get orders that are delivered or completed (these represent debt)
        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
                status: { in: ['DELIVERED', 'COMPLETED'] },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                orderNumber: true,
                totalAmount: true,
                status: true,
                createdAt: true,
            },
        });

        const totalDebt = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        return NextResponse.json({ orders, totalDebt });
    } catch (error) {
        console.error('User debt error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
