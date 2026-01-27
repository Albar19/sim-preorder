import { hash } from 'bcryptjs';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('🌱 Seeding database...');

    const hashedPassword = await hash('admin123', 12);

    // Create Owner
    const owner = await prisma.user.upsert({
        where: { email: 'admin@preorder.com' },
        update: {},
        create: {
            email: 'admin@preorder.com',
            password: hashedPassword,
            name: 'Administrator',
            role: 'OWNER',
            phone: '081234567890',
        },
    });
    console.log('✅ Owner:', owner.email);

    // Create Kurir
    const kurir = await prisma.user.upsert({
        where: { email: 'kurir@preorder.com' },
        update: {},
        create: {
            email: 'kurir@preorder.com',
            password: hashedPassword,
            name: 'Kurir Satu',
            role: 'KURIR',
            phone: '081234567891',
        },
    });
    console.log('✅ Kurir:', kurir.email);

    // Create User
    const user = await prisma.user.upsert({
        where: { email: 'user@preorder.com' },
        update: {},
        create: {
            email: 'user@preorder.com',
            password: hashedPassword,
            name: 'User Demo',
            role: 'USER',
            phone: '081234567892',
        },
    });
    console.log('✅ User:', user.email);

    // Create sample items
    const items = [
        { name: 'Laptop Gaming', price: 12000000, stock: 5 },
        { name: 'Smartphone', price: 5000000, stock: 10 },
        { name: 'Smart TV 43"', price: 4500000, stock: 8 },
        { name: 'AC 1 PK', price: 5500000, stock: 6 },
        { name: 'Kulkas 2 Pintu', price: 7000000, stock: 4 },
    ];

    for (const item of items) {
        await prisma.item.upsert({
            where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
            update: {},
            create: {
                id: item.name.toLowerCase().replace(/\s+/g, '-'),
                name: item.name,
                price: item.price,
                stock: item.stock,
            },
        });
    }
    console.log('✅ Items:', items.length);

    console.log('\n🎉 Seeding selesai!');
    console.log('\n📋 Akun Login:');
    console.log('   Owner: admin@preorder.com / admin123');
    console.log('   Kurir: kurir@preorder.com / admin123');
    console.log('   User:  user@preorder.com / admin123');
    console.log('\n💡 User baru daftar via /register (role ditentukan owner)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
