import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Konfirmasi pembayaran cicilan oleh Owner
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Cek installment
        const installment = await prisma.installment.findUnique({
            where: { id },
            include: {
                application: true
            }
        });

        if (!installment) {
            return NextResponse.json({ error: 'Cicilan tidak ditemukan' }, { status: 404 });
        }

        if (installment.status === 'PAID') {
            return NextResponse.json({ error: 'Cicilan sudah dibayar' }, { status: 400 });
        }

        // Update installment
        const updated = await prisma.$transaction(async (tx) => {
            const inst = await tx.installment.update({
                where: { id },
                data: {
                    status: 'PAID',
                    paidAmount: installment.amount,
                    paidAt: new Date(),
                    confirmedBy: session.user.id,
                    confirmedAt: new Date()
                }
            });

            // Check if all installments are paid
            const remainingUnpaid = await tx.installment.count({
                where: {
                    applicationId: installment.applicationId,
                    status: { not: 'PAID' }
                }
            });

            // If all paid, update application status
            if (remainingUnpaid === 0) {
                await tx.creditApplication.update({
                    where: { id: installment.applicationId },
                    data: { status: 'COMPLETED' }
                });

                // Send completion notification
                await tx.notification.create({
                    data: {
                        userId: installment.application.userId,
                        title: 'Kredit Lunas!',
                        message: `Selamat! Kredit ${installment.application.applicationNo} telah lunas.`,
                        type: 'CREDIT_COMPLETED',
                        link: '/dashboard/user/credits'
                    }
                });
            } else {
                // Send payment confirmation notification
                await tx.notification.create({
                    data: {
                        userId: installment.application.userId,
                        title: 'Pembayaran Dikonfirmasi',
                        message: `Pembayaran cicilan ke-${installment.installmentNo} telah dikonfirmasi.`,
                        type: 'PAYMENT_CONFIRMED',
                        link: '/dashboard/user/installments'
                    }
                });
            }

            return inst;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error confirming payment:', error);
        return NextResponse.json({ error: 'Gagal konfirmasi pembayaran' }, { status: 500 });
    }
}
