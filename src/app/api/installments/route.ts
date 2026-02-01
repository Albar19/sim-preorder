import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List cicilan user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const applicationId = searchParams.get('applicationId');

        const isOwner = session.user.role === 'OWNER';

        const where: Record<string, unknown> = {};

        if (!isOwner) {
            where.application = { userId: session.user.id };
        }
        if (status) {
            where.status = status;
        }
        if (applicationId) {
            where.applicationId = applicationId;
        }

        const installments = await prisma.installment.findMany({
            where,
            include: {
                application: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, phone: true }
                        },
                        item: true
                    }
                }
            },
            orderBy: [
                { dueDate: 'asc' },
                { installmentNo: 'asc' }
            ]
        });

        return NextResponse.json(installments);
    } catch (error) {
        console.error('Error fetching installments:', error);
        return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }
}
