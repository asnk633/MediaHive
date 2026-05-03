import { db } from '@/db';
import { institutions } from '@/db/schema';

async function main() {
    const sampleInstitutions = [
        {
            name: 'Thaiba Garden Media',
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        }
    ];

    await db.insert(institutions).values(sampleInstitutions as any);
    
    console.log('✅ Institutions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
