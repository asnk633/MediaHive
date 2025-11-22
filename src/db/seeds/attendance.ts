import { db } from '@/db';
import { attendance } from '@/db/schema';

async function main() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Helper function to create date with specific time
    const createDateTime = (daysAgo: number, hours: number, minutes: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(hours, minutes, 0, 0);
        return date.toISOString();
    };

    const sampleAttendance = [
        // Past attendance with check-in and check-out (5 days ago)
        {
            userId: 3,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(5, 8, 45),
            checkOut: createDateTime(5, 17, 30),
            createdAt: createDateTime(5, 8, 45),
        },
        {
            userId: 4,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(5, 8, 50),
            checkOut: createDateTime(5, 17, 15),
            createdAt: createDateTime(5, 8, 50),
        },
        // 4 days ago
        {
            userId: 5,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(4, 9, 0),
            checkOut: createDateTime(4, 17, 45),
            createdAt: createDateTime(4, 9, 0),
        },
        // 3 days ago
        {
            userId: 3,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(3, 8, 40),
            checkOut: createDateTime(3, 17, 20),
            createdAt: createDateTime(3, 8, 40),
        },
        // 2 days ago
        {
            userId: 4,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(2, 8, 55),
            checkOut: createDateTime(2, 17, 30),
            createdAt: createDateTime(2, 8, 55),
        },
        // Yesterday with check-in only (no check-out)
        {
            userId: 3,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(1, 8, 40),
            checkOut: null,
            createdAt: createDateTime(1, 8, 40),
        },
        {
            userId: 5,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(1, 8, 55),
            checkOut: null,
            createdAt: createDateTime(1, 8, 55),
        },
        // Today with check-in only (no check-out)
        {
            userId: 5,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(0, 8, 50),
            checkOut: null,
            createdAt: createDateTime(0, 8, 50),
        },
        {
            userId: 3,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(0, 8, 45),
            checkOut: null,
            createdAt: createDateTime(0, 8, 45),
        },
        {
            userId: 4,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            checkIn: createDateTime(0, 9, 0),
            checkOut: null,
            createdAt: createDateTime(0, 9, 0),
        },
    ];

    await db.insert(attendance).values(sampleAttendance as any);
    
    console.log('✅ Attendance seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});