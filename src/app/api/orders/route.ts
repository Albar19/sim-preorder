import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List user's orders
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { item: true },
                },
                delivery: {
                    include: {
                        kurir: { select: { name: true, phone: true } },
                    },
                },
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new pre-order
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items, notes } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Items diperlukan' }, { status: 400 });
        }

        // Get item details and calculate total
        const itemIds = items.map((i: { itemId: string }) => i.itemId);
        const dbItems = await prisma.item.findMany({
            where: { id: { in: itemIds }, isActive: true },
        });

        if (dbItems.length !== itemIds.length) {
            return NextResponse.json({ error: 'Beberapa item tidak ditemukan' }, { status: 400 });
        }

        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItems = items.map((item: { itemId: string; quantity: number }) => {
            const dbItem = dbItems.find((i) => i.id === item.itemId);
            if (!dbItem) throw new Error('Item not found');
            const itemTotal = dbItem.price * item.quantity;
            totalAmount += itemTotal;
            return {
                itemId: item.itemId,
                quantity: item.quantity,
                price: dbItem.price,
            };
        });

        // Generate order number
        const orderCount = await prisma.order.count();
        const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}-${(orderCount + 1).toString().padStart(4, '0')}`;

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: session.user.id,
                totalAmount,
                notes,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: { include: { item: true } },
            },
        });

        // Create status log
        await prisma.statusLog.create({
            data: {
                orderId: order.id,
                status: 'PENDING',
                description: 'Pre-order dibuat',
                createdBy: session.user.id,
            },
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
