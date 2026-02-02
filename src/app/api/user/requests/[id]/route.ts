'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: User accept/decline request with tenor selection
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, tenor } = body;

        const existingRequest = await prisma.itemRequest.findUnique({
            where: { id }
        });

        if (!existingRequest) {
            return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
        }

        // Verify ownership
        if (existingRequest.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Only PRICED requests can be accepted/declined
        if (existingRequest.status !== 'PRICED') {
            return NextResponse.json({ error: 'Request belum ada penawaran harga' }, { status: 400 });
        }

        if (action === 'ACCEPT') {
            // Validate tenor
            const allowedTenors = [1, 3, 6, 12];
            if (!tenor || !allowedTenors.includes(tenor)) {
                return NextResponse.json({ error: 'Tenor tidak valid (1, 3, 6, atau 12)' }, { status: 400 });
            }

            // Calculate credit application details
            const totalPrice = existingRequest.ownerPrice! * existingRequest.quantity;
            const monthlyAmount = Math.ceil(totalPrice / tenor);

            // Generate application number
            const count = await prisma.creditApplication.count();
            const applicationNo = `CR-${String(count + 1).padStart(6, '0')}`;

            // Create credit application and update request in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create a temporary item for this request (or use a special "custom item" approach)
                // For now, we'll create a virtual item record
                const customItem = await tx.item.create({
                    data: {
                        name: existingRequest.itemName,
                        description: existingRequest.description || `Request dari user: ${session.user.name}`,
                        price: existingRequest.ownerPrice!,
                        stock: existingRequest.quantity,
                        imageUrl: existingRequest.imageUrl,
                        isActive: false, // Not visible in catalog
                    }
                });

                // Create credit application
                const application = await tx.creditApplication.create({
                    data: {
                        applicationNo,
                        userId: session.user.id,
                        itemId: customItem.id,
                        quantity: existingRequest.quantity,
                        itemPrice: existingRequest.ownerPrice!,
                        totalPrice,
                        tenor,
                        monthlyAmount,
                        notes: `Request Barang: ${existingRequest.itemName}`,
                        status: 'PENDING', // Still needs owner approval for credit
                    }
                });

                // Update request
                const updatedRequest = await tx.itemRequest.update({
                    where: { id },
                    data: {
                        userAccepted: true,
                        userTenor: tenor,
                        applicationId: application.id,
                        status: 'FULFILLED',
                    }
                });

                // Create notification for owner
                await tx.notification.create({
                    data: {
                        userId: session.user.id, // We'll notify the user about their own action
                        title: 'Request Barang Disetujui',
                        message: `Anda menyetujui penawaran harga untuk "${existingRequest.itemName}". Pengajuan kredit telah dibuat.`,
                        type: 'REQUEST_ACCEPTED',
                        link: `/dashboard/user/credits`
                    }
                });

                return { request: updatedRequest, application };
            });

            return NextResponse.json(result);
        } else if (action === 'DECLINE') {
            // User declines the price
            const updated = await prisma.itemRequest.update({
                where: { id },
                data: {
                    userAccepted: false,
                    status: 'USER_DECLINED',
                }
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
