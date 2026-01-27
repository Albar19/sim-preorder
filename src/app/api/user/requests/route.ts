'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: List requests for logged-in user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requests = await prisma.itemRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: Create new item request
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { itemName, description, quantity, maxPrice, imageUrl } = body;

        if (!itemName || itemName.trim() === '') {
            return NextResponse.json(
                { error: 'Nama barang wajib diisi' },
                { status: 400 }
            );
        }

        const request = await prisma.itemRequest.create({
            data: {
                userId: session.user.id,
                itemName: itemName.trim(),
                description: description?.trim() || null,
                imageUrl: imageUrl || null,
                quantity: parseInt(quantity) || 1,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null,
            },
        });

        return NextResponse.json(request, { status: 201 });
    } catch (error) {
        console.error('Error creating request:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
