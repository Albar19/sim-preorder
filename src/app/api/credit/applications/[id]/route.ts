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

// PUT - Owner update pengajuan
export async function PUT(
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
        const { quantity, tenor, notes, adminNotes } = body;

        const application = await prisma.creditApplication.findUnique({
            where: { id },
            include: { item: true }
        });

        if (!application) {
            return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
        }

        // Hanya bisa edit jika masih PENDING
        if (application.status !== 'PENDING') {
            return NextResponse.json({ error: 'Hanya bisa edit pengajuan yang masih pending' }, { status: 400 });
        }

        // Recalculate if quantity or tenor changed
        const newQty = quantity || application.quantity;
        const newTenor = tenor || application.tenor;
        const newTotalPrice = application.item.price * newQty;
        const newMonthlyAmount = Math.ceil(newTotalPrice / newTenor);

        const updated = await prisma.creditApplication.update({
            where: { id },
            data: {
                quantity: newQty,
                tenor: newTenor,
                totalPrice: newTotalPrice,
                monthlyAmount: newMonthlyAmount,
                notes: notes !== undefined ? notes : application.notes,
                adminNotes: adminNotes !== undefined ? adminNotes : application.adminNotes,
            },
            include: { item: true, user: true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating application:', error);
        return NextResponse.json({ error: 'Gagal mengupdate' }, { status: 500 });
    }
}

// DELETE - Owner hapus pengajuan
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const application = await prisma.creditApplication.findUnique({
            where: { id },
            include: { installments: true }
        });

        if (!application) {
            return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
        }

        // Jika sudah ada cicilan yang dibayar, tidak bisa dihapus
        const paidInstallments = application.installments.filter(i => i.status === 'PAID');
        if (paidInstallments.length > 0) {
            return NextResponse.json({ error: 'Tidak bisa hapus, sudah ada pembayaran' }, { status: 400 });
        }

        // Hapus cicilan terkait dulu
        await prisma.installment.deleteMany({
            where: { applicationId: id }
        });

        // Hapus notifikasi terkait
        await prisma.notification.deleteMany({
            where: { link: { contains: id } }
        });

        // Hapus aplikasi
        await prisma.creditApplication.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting application:', error);
        return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
    }
}
