import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Assign kurir to order
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: orderId } = await params;

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { kurirId } = await request.json();

        if (!kurirId) {
            return NextResponse.json({ error: 'Kurir harus dipilih' }, { status: 400 });
        }

        // Check if order exists
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
        }

        // Check if kurir exists and has KURIR role
        const kurir = await prisma.user.findUnique({ where: { id: kurirId } });
        if (!kurir || kurir.role !== 'KURIR') {
            return NextResponse.json({ error: 'Kurir tidak valid' }, { status: 400 });
        }

        // Check if delivery already exists for this order
        const existingDelivery = await prisma.delivery.findUnique({
            where: { orderId },
        });

        if (existingDelivery) {
            // Update existing delivery with new kurir
            await prisma.delivery.update({
                where: { orderId },
                data: { kurirId, status: 'ASSIGNED' },
            });
        } else {
            // Create new delivery
            await prisma.delivery.create({
                data: {
                    orderId,
                    kurirId,
                    status: 'ASSIGNED',
                },
            });
        }

        // Update order status to READY_TO_SHIP
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'READY_TO_SHIP' },
        });

        // Create status log
        await prisma.statusLog.create({
            data: {
                orderId,
                status: 'READY_TO_SHIP',
                description: `Kurir ${kurir.name} ditugaskan untuk mengantar pesanan`,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json({ message: 'Kurir berhasil ditugaskan' });
    } catch (error) {
        console.error('Assign kurir error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
