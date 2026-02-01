import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Owner reject pengajuan kredit
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

        // Update status
        const updated = await prisma.$transaction(async (tx) => {
            const app = await tx.creditApplication.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    adminNotes: adminNotes || 'Pengajuan ditolak',
                    rejectedAt: new Date()
                }
            });

            // Create notification for user
            await tx.notification.create({
                data: {
                    userId: application.userId,
                    title: 'Pengajuan Kredit Ditolak',
                    message: `Pengajuan kredit ${application.applicationNo} ditolak. ${adminNotes || ''}`,
                    type: 'APPLICATION_REJECTED',
                    link: '/dashboard/user/credits'
                }
            });

            return app;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error rejecting application:', error);
        return NextResponse.json({ error: 'Gagal menolak pengajuan' }, { status: 500 });
    }
}
