import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@thaiba.com',
            fullName: 'Admin User',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'admin',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            email: 'manager@thaiba.com',
            fullName: 'Manager',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'admin',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            email: 'john@thaiba.com',
            fullName: 'John Doe',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'team',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            email: 'jane@thaiba.com',
            fullName: 'Jane Smith',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'team',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            email: 'mike@thaiba.com',
            fullName: 'Mike Johnson',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'team',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            email: 'guest1@thaiba.com',
            fullName: 'Guest One',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'guest',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            email: 'guest2@thaiba.com',
            fullName: 'Guest Two',
            passwordHash: '$2a$10$dummyhashfordemopurposesonly',
            role: 'guest',
            avatar_url: null,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers as any);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
