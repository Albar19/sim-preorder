import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Detail pengajuan
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const application = await prisma.creditApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, address: true }
                },
                item: true,
                installments: {
                    orderBy: { installmentNo: 'asc' }
                }
            }
        });

        if (!application) {
            return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
        }

        // User hanya bisa lihat miliknya
        if (session.user.role !== 'OWNER' && application.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(application);
    } catch (error) {
        console.error('Error fetching application:', error);
        return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }
}
