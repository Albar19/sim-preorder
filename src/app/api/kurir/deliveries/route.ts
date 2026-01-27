import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List kurir's deliveries
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'KURIR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const deliveries = await prisma.delivery.findMany({
            where: { kurirId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    include: {
                        user: { select: { name: true, phone: true, address: true } },
                        items: { include: { item: true } },
                    },
                },
            },
        });

        return NextResponse.json(deliveries);
    } catch (error) {
        console.error('Kurir deliveries error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
