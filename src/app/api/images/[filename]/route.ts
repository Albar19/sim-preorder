import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;

        // Determine upload directory
        const uploadDir = process.env.NODE_ENV === 'production'
            ? '/app/uploads'
            : path.join(process.cwd(), 'public', 'uploads');

        const filepath = path.join(uploadDir, filename);

        // Check if file exists
        if (!existsSync(filepath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read file
        const fileBuffer = await readFile(filepath);

        // Determine content type
        const ext = filename.split('.').pop()?.toLowerCase();
        const contentTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
        };
        const contentType = contentTypes[ext || ''] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
