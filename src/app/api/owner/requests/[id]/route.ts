'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Update request - Owner set price or reject
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, ownerPrice, adminNotes } = body;

        const existingRequest = await prisma.itemRequest.findUnique({
            where: { id }
        });

        if (!existingRequest) {
            return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
        }

        // Handle different actions
        if (action === 'SET_PRICE') {
            // Owner sets price - status becomes PRICED
            if (!ownerPrice || ownerPrice <= 0) {
                return NextResponse.json({ error: 'Harga harus diisi dan lebih dari 0' }, { status: 400 });
            }

            const updated = await prisma.itemRequest.update({
                where: { id },
                data: {
                    ownerPrice,
                    status: 'PRICED',
                    adminNotes: adminNotes || null,
                    userAccepted: null, // Reset user response
                },
            });

            return NextResponse.json(updated);
        } else if (action === 'REJECT') {
            // Owner rejects the request
            const updated = await prisma.itemRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    adminNotes: adminNotes || null,
                },
            });

            return NextResponse.json(updated);
        } else {
            return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE: Delete request (owner only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        await prisma.itemRequest.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting request:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
