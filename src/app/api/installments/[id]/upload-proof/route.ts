import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST - User upload bukti transfer
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Cek installment dan pastikan milik user
        const installment = await prisma.installment.findUnique({
            where: { id },
            include: {
                application: true
            }
        });

        if (!installment) {
            return NextResponse.json({ error: 'Cicilan tidak ditemukan' }, { status: 404 });
        }

        if (installment.application.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (installment.status === 'PAID') {
            return NextResponse.json({ error: 'Cicilan sudah dibayar' }, { status: 400 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('proof') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'File bukti transfer diperlukan' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP' }, { status: 400 });
        }

        // Create unique filename
        const timestamp = Date.now();
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `proof_${id}_${timestamp}.${ext}`;

        // Ensure upload directory exists - use /app/uploads for Docker volume mount
        const uploadDir = path.join(process.cwd(), 'uploads', 'proofs');
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Update installment with proof URL - use API route to serve image
        const proofUrl = `/api/uploads/proofs/${filename}`;
        const updated = await prisma.installment.update({
            where: { id },
            data: {
                paymentProof: proofUrl,
                status: 'PENDING_VERIFICATION' // New status: waiting for owner verification
            }
        });

        // Notify owner
        const owners = await prisma.user.findMany({
            where: { role: 'OWNER' }
        });

        for (const owner of owners) {
            await prisma.notification.create({
                data: {
                    userId: owner.id,
                    title: 'Bukti Transfer Baru',
                    message: `User ${session.user.name} mengunggah bukti transfer untuk cicilan ke-${installment.installmentNo}`,
                    type: 'PAYMENT_PROOF_UPLOADED',
                    link: '/dashboard/owner/installments'
                }
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error uploading proof:', error);
        return NextResponse.json({ error: 'Gagal mengupload bukti transfer' }, { status: 500 });
    }
}
