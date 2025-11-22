import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@thaiba.com',
            fullName: 'Admin User',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'admin',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'manager@thaiba.com',
            fullName: 'Manager',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'admin',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'john@thaiba.com',
            fullName: 'John Doe',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'team',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'jane@thaiba.com',
            fullName: 'Jane Smith',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'team',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'mike@thaiba.com',
            fullName: 'Mike Johnson',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'team',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'guest1@thaiba.com',
            fullName: 'Guest One',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'guest',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            email: 'guest2@thaiba.com',
            fullName: 'Guest Two',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'guest',
            avatarUrl: null,
            institutionId: 1,
            tenantId: 1, // Add missing tenantId
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers as any);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});