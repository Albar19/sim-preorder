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
            // DP (maxPrice) dikurangi dari total
            const grossTotal = existingRequest.ownerPrice! * existingRequest.quantity;
            const dp = existingRequest.maxPrice || 0;
            const totalPrice = grossTotal - dp; // Total setelah dikurangi DP

            if (totalPrice <= 0) {
                return NextResponse.json({ error: 'DP melebihi atau sama dengan total harga' }, { status: 400 });
            }

            const monthlyAmount = Math.ceil(totalPrice / tenor);

            // Generate application number
            const count = await prisma.creditApplication.count();
            const applicationNo = `CR-${String(count + 1).padStart(6, '0')}`;

            // Create credit application and update request in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create a temporary item for this request
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

                // Create credit application with DP info in notes
                const application = await tx.creditApplication.create({
                    data: {
                        applicationNo,
                        userId: session.user.id,
                        itemId: customItem.id,
                        quantity: existingRequest.quantity,
                        itemPrice: existingRequest.ownerPrice!,
                        totalPrice, // Total setelah dikurangi DP
                        tenor,
                        monthlyAmount,
                        notes: `Request Barang: ${existingRequest.itemName} | DP: Rp ${dp.toLocaleString('id-ID')} | Total Awal: Rp ${grossTotal.toLocaleString('id-ID')}`,
                        status: 'PENDING', // Still needs owner approval for credit
                    }
                });

                // Generate order number
                const orderCount = await tx.order.count();
                const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

                // Create Order immediately so owner can assign kurir
                const order = await tx.order.create({
                    data: {
                        orderNumber,
                        userId: session.user.id,
                        totalAmount: grossTotal,
                        status: 'PROCESSING', // Ready for kurir assignment
                        notes: `Request: ${existingRequest.itemName} | ${applicationNo}`,
                        items: {
                            create: {
                                itemId: customItem.id,
                                quantity: existingRequest.quantity,
                                price: existingRequest.ownerPrice!
                            }
                        }
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

                // Create notification for user
                await tx.notification.create({
                    data: {
                        userId: session.user.id,
                        title: 'Request Barang Disetujui',
                        message: `Anda menyetujui penawaran harga untuk "${existingRequest.itemName}". Order ${orderNumber} siap dikirim.`,
                        type: 'REQUEST_ACCEPTED',
                        link: `/dashboard/user/orders`
                    }
                });

                // Notify owners about new order for kurir assignment
                const owners = await tx.user.findMany({ where: { role: 'OWNER' } });
                for (const owner of owners) {
                    await tx.notification.create({
                        data: {
                            userId: owner.id,
                            title: 'Order Baru dari Request',
                            message: `${session.user.name} menerima penawaran "${existingRequest.itemName}". Silakan assign kurir.`,
                            type: 'NEW_ORDER',
                            link: `/dashboard/owner/orders`
                        }
                    });
                }

                return { request: updatedRequest, application, order };
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
