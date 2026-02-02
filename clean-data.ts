// Script to clean demo data while keeping user accounts
import prisma from './src/lib/prisma';

async function cleanDemoData() {
    console.log('🧹 Starting data cleanup...');

    try {
        // Delete in correct order due to foreign key constraints

        // 1. Delete notifications
        const notifCount = await prisma.notification.deleteMany({});
        console.log(`✓ Deleted ${notifCount.count} notifications`);

        // 2. Delete status logs
        const logsCount = await prisma.statusLog.deleteMany({});
        console.log(`✓ Deleted ${logsCount.count} status logs`);

        // 3. Delete deliveries
        const deliveryCount = await prisma.delivery.deleteMany({});
        console.log(`✓ Deleted ${deliveryCount.count} deliveries`);

        // 4. Delete order items
        const orderItemCount = await prisma.orderItem.deleteMany({});
        console.log(`✓ Deleted ${orderItemCount.count} order items`);

        // 5. Delete orders
        const orderCount = await prisma.order.deleteMany({});
        console.log(`✓ Deleted ${orderCount.count} orders`);

        // 6. Delete installments
        const installmentCount = await prisma.installment.deleteMany({});
        console.log(`✓ Deleted ${installmentCount.count} installments`);

        // 7. Delete credit applications
        const creditCount = await prisma.creditApplication.deleteMany({});
        console.log(`✓ Deleted ${creditCount.count} credit applications`);

        // 8. Delete item requests
        const requestCount = await prisma.itemRequest.deleteMany({});
        console.log(`✓ Deleted ${requestCount.count} item requests`);

        // 9. Delete items (products)
        const itemCount = await prisma.item.deleteMany({});
        console.log(`✓ Deleted ${itemCount.count} items/products`);

        console.log('\n✅ Data cleanup complete! User accounts are preserved.');

        // Show remaining users
        const users = await prisma.user.findMany({
            select: { name: true, email: true, role: true }
        });
        console.log('\n👥 Remaining user accounts:');
        users.forEach(u => console.log(`   - ${u.name} (${u.role}) - ${u.email}`));

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDemoData();
