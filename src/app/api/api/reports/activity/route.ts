import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const db = adminDb;

        // --- 1. FILTERING PARAMS ---
        const actorId = searchParams.get('actorId');
        const action = searchParams.get('action'); // machine name e.g. task_created
        const entityType = searchParams.get('entityType'); // task, file, etc
        const severity = searchParams.get('severity'); // info, warning, critical
        let fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        let limitParam = parseInt(searchParams.get('limit') || '50');
        if (limitParam > 100) limitParam = 100; // Safety cap
        const exportFormat = searchParams.get('export'); // 'csv' | 'json'

        // --- RETENTION POLICY (Default 60 Days) ---
        // If no specific date range is requested, default to last 60 days.
        // This implements "Soft Retention" by default.
        if (!fromDate && !toDate) {
            const d = new Date();
            d.setDate(d.getDate() - 60);
            fromDate = d.toISOString();
        }

        // --- 2. BUILD QUERY ---
        let query: FirebaseFirestore.Query = db.collection('system_activity');

        // Apply filters
        // Note: Firestore requires composite indexes for multiple equality + range/sort.
        // We will apply equality filters first.
        if (actorId) query = query.where('actorId', '==', actorId);
        if (action) query = query.where('action', '==', action);
        if (entityType) query = query.where('entityType', '==', entityType);
        if (severity) query = query.where('severity', '==', severity);

        // Date Range
        if (fromDate) query = query.where('createdAt', '>=', fromDate);
        if (toDate) query = query.where('createdAt', '<=', toDate);

        // Ordering & Limit
        // If sorting by createdAt, we need an index if we have equality filters.
        // For now, let's assume index exists or handle potential error gracefully.
        query = query.orderBy('createdAt', 'desc');

        if (!exportFormat) {
            query = query.limit(limitParam);
        } else {
            // Export limit (higher but capped safety)
            query = query.limit(1000);
        }

        const snapshot = await query.get();

        const feed = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Normalized fields for UI
                type: data.entityType || 'system',
                title: data.summary || 'System Activity',
                description: `Action: ${data.action} • Role: ${data.actorRole}`,
                timestamp: data.createdAt || new Date().toISOString(),
                // Ensure severity is present
                severity: data.severity || 'info'
            };
        });

        // --- 3. EXPORT HANDLING ---
        if (exportFormat === 'json') {
            return new NextResponse(JSON.stringify(feed, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="system_activity_export_${Date.now()}.json"`
                }
            });
        }

        if (exportFormat === 'csv') {
            // Simple CSV construction
            const headers = ['Timestamp', 'Action', 'Severity', 'Actor', 'Role', 'Summary', 'Entity Type', 'Entity ID'];
            const rows = feed.map((row: any) => [
                row.timestamp,
                row.action,
                row.severity,
                row.actorId, // or lookup name if available (not here)
                row.actorRole,
                `"${(row.summary || '').replace(/"/g, '""')}"`, // Escape quotes
                row.entityType,
                row.entityId
            ].join(','));

            const csvContent = [headers.join(','), ...rows].join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="system_activity_export_${Date.now()}.csv"`
                }
            });
        }

        // --- 4. STANDARD JSON RESPONSE ---
        return NextResponse.json({
            activity: feed
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
            }
        });

    } catch (error: any) {
        console.error('Error fetching activity report:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch activity' }, { status: 500 });
    }
}
