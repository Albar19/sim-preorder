import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filename } = await params;

        // Sanitize filename to prevent directory traversal
        const safeFilename = path.basename(filename);
        const filePath = path.join(process.cwd(), 'uploads', 'proofs', safeFilename);

        try {
            const fileBuffer = await readFile(filePath);
            const ext = path.extname(safeFilename).toLowerCase();
            let contentType = 'application/octet-stream';

            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.webp') contentType = 'image/webp';

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400', // Cache for 1 day
                },
            });
        } catch (error) {
            // Check if error is file not found
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error serving file:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
