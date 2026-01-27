import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all deliveries (Owner only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const deliveries = await prisma.delivery.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        totalAmount: true,
                        user: {
                            select: { name: true, address: true },
                        },
                    },
                },
                kurir: {
                    select: { name: true, phone: true },
                },
            },
        });

        return NextResponse.json(deliveries);
    } catch (error) {
        console.error('Get deliveries error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
