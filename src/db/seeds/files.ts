import { db } from '@/db';
import { files } from '@/db/schema';

async function main() {
    const sampleFiles = [
        {
            name: 'Company_Logo_2024.png',
            fileUrl: '/uploads/logo_2024.png',
            fileType: 'image/png',
            fileSize: 245678,
            folder: 'branding',
            visibility: 'all',
            uploadedById: 1,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Brand_Guidelines.pdf',
            fileUrl: '/uploads/brand_guidelines.pdf',
            fileType: 'application/pdf',
            fileSize: 1567890,
            folder: 'branding',
            visibility: 'all',
            uploadedById: 2,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Office_Photo.jpg',
            fileUrl: '/uploads/office.jpg',
            fileType: 'image/jpeg',
            fileSize: 892345,
            folder: 'general',
            visibility: 'all',
            uploadedById: 1,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Q1_Analytics_Report.xlsx',
            fileUrl: '/uploads/q1_analytics.xlsx',
            fileType: 'application/vnd.ms-excel',
            fileSize: 456789,
            folder: 'reports',
            visibility: 'team',
            uploadedById: 2,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Client_Contract_Draft.docx',
            fileUrl: '/uploads/contract_draft.docx',
            fileType: 'application/msword',
            fileSize: 234567,
            folder: 'contracts',
            visibility: 'team',
            uploadedById: 1,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Team_Meeting_Notes.txt',
            fileUrl: '/uploads/meeting_notes.txt',
            fileType: 'text/plain',
            fileSize: 12345,
            folder: 'meetings',
            visibility: 'team',
            uploadedById: 3,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Product_Catalog_2024.pdf',
            fileUrl: '/uploads/catalog_2024.pdf',
            fileType: 'application/pdf',
            fileSize: 3456789,
            folder: 'public',
            visibility: 'member',
            uploadedById: 1,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
        {
            name: 'Social_Media_Template.psd',
            fileUrl: '/uploads/sm_template.psd',
            fileType: 'image/vnd.adobe.photoshop',
            fileSize: 5678901,
            folder: 'templates',
            visibility: 'member',
            uploadedById: 4,
            institution_id: 1,
            tenantId: 1, // Add missing tenantId
            created_at: new Date().toISOString(),
        },
    ];

    await db.insert(files).values(sampleFiles as any);
    
    console.log('✅ Files seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
