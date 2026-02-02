import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Owner reject bukti transfer
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
        const { reason } = await request.json();

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

        if (installment.status !== 'PENDING_VERIFICATION') {
            return NextResponse.json({ error: 'Bukti tidak dalam status menunggu verifikasi' }, { status: 400 });
        }

        // Reset to UNPAID
        const updated = await prisma.$transaction(async (tx) => {
            const inst = await tx.installment.update({
                where: { id },
                data: {
                    status: 'UNPAID',
                    paymentProof: null
                }
            });

            // Notify user
            await tx.notification.create({
                data: {
                    userId: installment.application.userId,
                    title: 'Bukti Transfer Ditolak',
                    message: `Bukti transfer cicilan ke-${installment.installmentNo} ditolak. Alasan: ${reason || 'Tidak sesuai'}. Silakan upload ulang.`,
                    type: 'PAYMENT_PROOF_REJECTED',
                    link: '/dashboard/user/installments'
                }
            });

            return inst;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error rejecting proof:', error);
        return NextResponse.json({ error: 'Gagal menolak bukti' }, { status: 500 });
    }
}
