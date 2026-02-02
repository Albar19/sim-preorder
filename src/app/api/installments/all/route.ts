import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Owner: Get all installments
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const installments = await prisma.installment.findMany({
            include: {
                application: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            }
                        },
                        item: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { status: 'asc' }, // PENDING_VERIFICATION first
                { dueDate: 'asc' }
            ]
        });

        return NextResponse.json(installments);
    } catch (error) {
        console.error('Error fetching all installments:', error);
        return NextResponse.json({ error: 'Gagal mengambil data cicilan' }, { status: 500 });
    }
}
