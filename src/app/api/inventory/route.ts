import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';
import { withTenant } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

const COLLECTION = 'inventory';

// Helper to calculate status
function calculateStatus(quantity: number, threshold: number): 'ok' | 'low' | 'out' {
    if (quantity <= 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'ok';
}

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/inventory] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: items, error, count } = await withTenant(
            supabase
                .from(COLLECTION)
                .select('*', { count: 'exact' }),
            tenantId
        )
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Map snake_case to camelCase for the frontend
        const mappedItems = (items || []).map((item: any) => ({
            ...item,
            driveFileId: item.drive_file_id,
            imageUrl: item.image_url,
            serialNumber: item.serial_number,
            purchaseDate: item.purchase_date,
            purchasePrice: item.purchase_price,
            assetStatus: item.asset_status,
            locationStr: item.location_str
        }));

        return NextResponse.json({
            items: mappedItems,
            meta: {
                total: count || 0,
                limit,
                offset,
                hasMore: offset + (items?.length || 0) < (count || 0)
            }
        });
    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[POST /api/inventory] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const data = await request.json();

        // Strict Validation
        const requiredFields = ['name', 'category', 'quantity', 'unit', 'threshold'];
        const missing = requiredFields.filter(field => data[field] === undefined || data[field] === null || data[field] === '');

        if (missing.length > 0) {
            return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
        }

        const quantity = Number(data.quantity);
        const threshold = Number(data.threshold);

        if (isNaN(quantity) || isNaN(threshold)) {
            return NextResponse.json({ error: 'Quantity and threshold must be numbers' }, { status: 400 });
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const newItem = {
            name: String(data.name),
            category: String(data.category),
            quantity,
            unit: String(data.unit),
            threshold,
            status: calculateStatus(quantity, threshold),
            created_by: user.uid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            image_url: data.imageUrl || null,
            images: data.images || [],
            drive_file_id: data.driveFileId || null,
            condition: data.condition,
            serial_number: data.serialNumber,
            remarks: data.remarks,
            purchase_price: Number(data.purchasePrice) || 0,
            asset_status: data.assetStatus,
            location_str: data.locationStr || null,
            notes: data.notes || null,
            purchase_date: data.purchaseDate,
            tenant_id: tenantId
        };

        const { data: created, error } = await supabase
            .from(COLLECTION)
            .insert(newItem)
            .select()
            .single();

        if (error) throw error;

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role || 'viewer',
            action: 'inventory_item_create',
            entityType: 'inventory_item',
            entityId: created.id,
            tenantId: tenantId, // Enforce tenant scoping in logs
            summary: `Added item: ${data.name}`,
            source: 'system',
            severity: 'info',
            visibility: { mode: 'admin' },
            metadata: { category: data.category }
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error: any) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json({ error: error.message || 'Failed to create item' }, { status: 500 });
    }
}
