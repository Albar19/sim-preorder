import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all active items
export async function GET() {
    try {
        const items = await prisma.item.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error('Items error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
