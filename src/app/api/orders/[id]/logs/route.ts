import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isWeb3Configured, getOrderLogsFromBlockchain } from '@/lib/web3';

// GET - Get status logs for an order (from database and optionally blockchain)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get logs from database
        const dbLogs = await prisma.statusLog.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'asc' },
        });

        // Get logs from blockchain if configured
        let blockchainLogs: Awaited<ReturnType<typeof getOrderLogsFromBlockchain>> = [];
        const web3Enabled = isWeb3Configured();

        if (web3Enabled) {
            blockchainLogs = await getOrderLogsFromBlockchain(id);
        }

        return NextResponse.json({
            dbLogs,
            blockchainLogs,
            web3Enabled,
        });
    } catch (error) {
        console.error('Status logs error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
