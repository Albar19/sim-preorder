import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - User mengajukan kredit
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { itemId, quantity, tenor, notes } = body;

        // Validasi
        if (!itemId || !tenor) {
            return NextResponse.json({ error: 'Item dan tenor wajib diisi' }, { status: 400 });
        }

        const allowedTenors = [1, 3, 6, 12]; // 1 = Cash
        if (!allowedTenors.includes(tenor)) {
            return NextResponse.json({ error: 'Tenor tidak valid' }, { status: 400 });
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
                userId: session.user.id,
                itemId,
                quantity: qty,
                itemPrice: item.price,
                totalPrice,
                tenor,
                monthlyAmount,
                notes: notes || null,
            },
            include: {
                item: true,
            }
        });

        return NextResponse.json(application, { status: 201 });
    } catch (error) {
        console.error('Error creating credit application:', error);
        return NextResponse.json({ error: 'Gagal mengajukan kredit' }, { status: 500 });
    }
}

// GET - List pengajuan kredit
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Owner bisa lihat semua, user hanya miliknya
        const isOwner = session.user.role === 'OWNER';

        const where: Record<string, unknown> = {};
        if (!isOwner) {
            where.userId = session.user.id;
        }
        if (status) {
            where.status = status;
        }

        const applications = await prisma.creditApplication.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                item: true,
                installments: {
                    orderBy: { installmentNo: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(applications);
    } catch (error) {
        console.error('Error fetching credit applications:', error);
        return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }
}
