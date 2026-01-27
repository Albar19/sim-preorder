import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all items (including inactive for owner)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const items = await prisma.item.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error('Owner items error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new item
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, price, stock, imageUrl } = await request.json();

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'Nama dan harga diperlukan' }, { status: 400 });
        }

        const item = await prisma.item.create({
            data: {
                name,
                description: description || null,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                imageUrl: imageUrl || null,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Create item error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
