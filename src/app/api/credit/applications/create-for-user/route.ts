import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Owner membuat pengajuan kredit atas nama user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, itemId, quantity, tenor, notes } = body;

        // Validasi
        if (!userId || !itemId || !tenor) {
            return NextResponse.json({ error: 'User, Item, dan tenor wajib diisi' }, { status: 400 });
        }

        const allowedTenors = [1, 3, 6, 12];
        if (!allowedTenors.includes(tenor)) {
            return NextResponse.json({ error: 'Tenor tidak valid' }, { status: 400 });
        }

        // Cek user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        // Ambil data item
        const item = await prisma.item.findUnique({
            where: { id: itemId }
        });

        if (!item || !item.isActive) {
            return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
        }

        // Hitung total dan cicilan
        const qty = quantity || 1;
        const totalPrice = item.price * qty;
        const monthlyAmount = Math.ceil(totalPrice / tenor);

        // Generate nomor aplikasi
        const count = await prisma.creditApplication.count();
        const applicationNo = `CR-${String(count + 1).padStart(6, '0')}`;

        // Buat pengajuan kredit
        const application = await prisma.creditApplication.create({
            data: {
                applicationNo,
                userId: userId,  // User yang dipilih, bukan session user
                itemId,
                quantity: qty,
                itemPrice: item.price,
                totalPrice,
                tenor,
                monthlyAmount,
                notes: notes || null,
                adminNotes: `Dibuat oleh Owner: ${session.user.name || session.user.email}`,
            },
            include: {
                item: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(application, { status: 201 });
    } catch (error) {
        console.error('Error creating credit application for user:', error);
        return NextResponse.json({ error: 'Gagal membuat pengajuan' }, { status: 500 });
    }
}
