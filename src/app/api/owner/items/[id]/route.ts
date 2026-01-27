import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Get item by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const item = await prisma.item.findUnique({ where: { id } });

        if (!item) {
            return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update item
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, price, stock, imageUrl, isActive } = await request.json();

        const item = await prisma.item.update({
            where: { id },
            data: {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                stock: stock !== undefined ? parseInt(stock) : undefined,
                imageUrl,
                isActive,
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Update item error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete item (hard delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.item.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Item berhasil dihapus' });
    } catch (error) {
        console.error('Delete item error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
