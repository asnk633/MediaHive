import { db } from '@/db';
import { events } from '@/db/schema';

async function main() {
    const now = new Date();
    const currentTimestamp = now.toISOString();

    const getDateFromNow = (days: number, hours: number, minutes: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() + days);
        date.setHours(hours, minutes, 0, 0);
        return date.toISOString();
    };

    const sampleEvents = [
        {
            title: 'Team Standup Meeting',
            description: 'Daily sync with the team',
            startTime: getDateFromNow(1, 9, 0),
            endTime: getDateFromNow(1, 9, 30),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 1,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Client Presentation',
            description: 'Present new campaign to client',
            startTime: getDateFromNow(2, 14, 0),
            endTime: getDateFromNow(2, 15, 30),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 2,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Content Strategy Workshop',
            description: 'Planning Q2 content strategy',
            startTime: getDateFromNow(3, 10, 0),
            endTime: getDateFromNow(3, 12, 0),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 1,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Photography Session',
            description: 'Product photography for new collection',
            startTime: getDateFromNow(4, 13, 0),
            endTime: getDateFromNow(4, 16, 0),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 2,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Marketing Review Meeting',
            description: 'Monthly marketing performance review',
            startTime: getDateFromNow(5, 15, 0),
            endTime: getDateFromNow(5, 16, 30),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 1,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Social Media Training',
            description: 'Training session on new tools',
            startTime: getDateFromNow(7, 11, 0),
            endTime: getDateFromNow(7, 13, 0),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 2,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Brand Strategy Discussion',
            description: 'Discussing brand positioning',
            startTime: getDateFromNow(10, 9, 30),
            endTime: getDateFromNow(10, 11, 0),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 1,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
        {
            title: 'Video Production Planning',
            description: 'Planning next video campaign',
            startTime: getDateFromNow(12, 14, 0),
            endTime: getDateFromNow(12, 16, 0),
            approval_status: 'pending',
            institution_id: 1,
            tenantId: 1,
            createdById: 2,
            created_at: currentTimestamp,
            updated_at: currentTimestamp,
        },
    ];

    await db.insert(events).values(sampleEvents as any);
    
    console.log('✅ Events seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});

