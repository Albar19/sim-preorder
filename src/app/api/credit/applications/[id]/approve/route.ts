import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Owner approve pengajuan kredit
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
        const body = await request.json();
        const { adminNotes } = body;

        // Cek aplikasi
        const application = await prisma.creditApplication.findUnique({
            where: { id }
        });

        if (!application) {
            return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
        }

        if (application.status !== 'PENDING') {
            return NextResponse.json({ error: 'Pengajuan sudah diproses' }, { status: 400 });
        }

        // Generate installments
        const installmentsData = [];
        const now = new Date();

        for (let i = 1; i <= application.tenor; i++) {
            const dueDate = new Date(now);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(1); // Jatuh tempo tanggal 1 setiap bulan

            installmentsData.push({
                applicationId: id,
                installmentNo: i,
                amount: application.monthlyAmount,
                dueDate,
                status: 'UNPAID'
            });
        }

        // Update status dan buat cicilan
        const updated = await prisma.$transaction(async (tx) => {
            // Update application
            const app = await tx.creditApplication.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    adminNotes: adminNotes || null,
                    approvedAt: new Date()
                }
            });

            // Create installments
            await tx.installment.createMany({
                data: installmentsData
            });

            // Create notification for user
            await tx.notification.create({
                data: {
                    userId: application.userId,
                    title: 'Pengajuan Kredit Disetujui',
                    message: `Pengajuan kredit ${application.applicationNo} telah disetujui. Silakan lihat jadwal cicilan Anda.`,
                    type: 'APPLICATION_APPROVED',
                    link: '/dashboard/user/installments'
                }
            });

            return app;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error approving application:', error);
        return NextResponse.json({ error: 'Gagal menyetujui pengajuan' }, { status: 500 });
    }
}
