import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Get delivery details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id || session.user.role !== 'KURIR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const delivery = await prisma.delivery.findFirst({
            where: { id, kurirId: session.user.id },
            include: {
                order: {
                    include: {
                        user: { select: { name: true, phone: true, address: true } },
                        items: { include: { item: true } },
                    },
                },
            },
        });

        if (!delivery) {
            return NextResponse.json({ error: 'Delivery tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(delivery);
    } catch (error) {
        console.error('Get delivery error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Update delivery status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id || session.user.role !== 'KURIR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status, notes } = await request.json();

        const validStatuses = ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVED', 'DELIVERED', 'CONFIRMED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
        }

        // Update delivery
        const updateData: { status: string; notes?: string; pickedUpAt?: Date; deliveredAt?: Date; confirmedAt?: Date } = { status };
        if (notes) updateData.notes = notes;

        // Set timestamps based on status
        const now = new Date();
        if (status === 'PICKED_UP') updateData.pickedUpAt = now;
        if (status === 'DELIVERED') updateData.deliveredAt = now;
        if (status === 'CONFIRMED') updateData.confirmedAt = now;

        const delivery = await prisma.delivery.update({
            where: { id, kurirId: session.user.id },
            data: updateData,
            include: { order: true },
        });

        // Update order status accordingly
        let orderStatus = delivery.order.status;
        if (status === 'PICKED_UP') orderStatus = 'SHIPPED';
        if (status === 'DELIVERED') orderStatus = 'DELIVERED';
        if (status === 'CONFIRMED') orderStatus = 'COMPLETED';

        await prisma.order.update({
            where: { id: delivery.orderId },
            data: { status: orderStatus },
        });

        // Create status log
        await prisma.statusLog.create({
            data: {
                orderId: delivery.orderId,
                status: `DELIVERY_${status}`,
                description: `Status pengiriman diubah ke ${status}`,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json(delivery);
    } catch (error) {
        console.error('Update delivery error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
