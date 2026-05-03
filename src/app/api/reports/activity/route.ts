import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const supabase = await getSupabaseFromRequest(req);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const { tenantId } = user; // Derive tenantId from verified user context

        const { searchParams } = new URL(req.url);

        // --- 1. FILTERING PARAMS ---
        const actorId = searchParams.get('actorId');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entityType'); // resource_type in SQL
        const severity = searchParams.get('severity');
        let fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        let limitParam = parseInt(searchParams.get('limit') || '50');
        if (limitParam > 100) limitParam = 100;
        const exportFormat = searchParams.get('export');

        // --- RETENTION POLICY (Default 60 Days) ---
        // If no specific date range is requested, default to last 60 days.
        // This implements "Soft Retention" by default.
        if (!fromDate && !toDate) {
            const d = new Date();
            d.setDate(d.getDate() - 60);
            fromDate = d.toISOString();
        }

        // --- 2. BUILD QUERY ---
        let query = supabase
            .from(TABLES.AUDIT_LOG)
            .select('*')
            .eq('tenant_id', tenantId);

        // Apply filters
        // Note: Firestore requires composite indexes for multiple equality + range/sort.
        // We will apply equality filters first.
        if (actorId) query = query.eq('user_id', actorId);
        if (action) query = query.eq('action', action);
        if (entityType) query = query.eq('resource_type', entityType);

        // Severity is often trapped inside the 'details' JSON in our current SQL schema
        // If we need strict filtering, we might need a different approach or a calculated column.
        // For now, we filter locally if severity is provided, or assume it's a top-level column if possible.
        // PostgREST allows filtering on JSON: .eq('details->>severity', severity)
        if (severity) query = query.eq('details->>severity', severity);

        // Date Range
        if (fromDate) query = query.gte('created_at', fromDate);
        if (toDate) query = query.lte('created_at', toDate);

        // Ordering & Limit
        // If sorting by created_at, we need an index if we have equality filters.
        // For now, let's assume index exists or handle potential error gracefully.
        query = query.order('created_at', { ascending: false });

        if (!exportFormat) {
            query = query.limit(limitParam);
        } else {
            // Export limit (higher but capped safety)
            query = query.limit(1000);
        }

        const { data: logs, error } = await query;
        if (error) throw error;

        const feed = (logs || []).map(log => {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details || {};
            return {
                id: log.id,
                ...log,
                // Normalized fields for UI
                type: log.resource_type || 'system',
                title: details.summary || 'System Activity',
                description: `Action: ${log.action} • Role: ${details.role || 'Unknown'}`,
                timestamp: log.created_at,
                severity: details.severity || 'info'
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
            const headers = ['Timestamp', 'Action', 'Severity', 'Actor', 'Summary', 'Resource Type', 'Resource ID'];
            const rows = feed.map((row: any) => [
                row.created_at,
                row.action,
                row.severity,
                row.user_id, // or lookup name if available (not here)
                `"${(row.title || '').replace(/"/g, '""')}"`, // Escape quotes
                row.resource_type,
                row.resource_id
            ]).join(',');

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
