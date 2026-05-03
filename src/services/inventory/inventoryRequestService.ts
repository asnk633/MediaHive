import { InventoryRequestClean, InventoryRequestSchema } from "./inventoryContract";
import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { eventBus } from "@/system/events/eventSystem";

function mapRequest(row: any): InventoryRequestClean {
    const request = {
        id: row.id,
        itemId: row.item_id || row.itemId,
        itemName: row.item_name || row.itemName,
        requestedBy: row.requested_by || row.requestedBy,
        requestedByRole: row.requested_by_role || row.requestedByRole,
        purpose: row.purpose,
        institutionId: row.institution_id || row.institutionId,
        status: row.status,
        createdAt: row.created_at || row.createdAt,
    };
    const result = InventoryRequestSchema.safeParse(request);
    if (!result.success) {
        console.error("[InventoryMapping][Request] Validation failed:", result.error.format());
        return request as InventoryRequestClean;
    }
    return result.data;
}

/**
 * inventoryRequestService (Direct Supabase Access)
 */
export const inventoryRequestService = {
    // Create Request
    create: async (data: any) => {
        const { tenantId, userId } = await tenantContext();

        const { data: result, error } = await supabase
            .from('inventory_requests')
            .insert([{
                item_id: data.itemId,
                item_name: data.itemName,
                requested_by: userId,
                requested_by_role: data.requestedByRole,
                purpose: data.purpose,
                institution_id: data.institutionId,
                tenant_id: tenantId,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select('id')
            .single();

        if (error) throw error;
        return result.id;
    },

    // Get All Requests (Admin)
    getAll: async (institutionId?: string | number): Promise<InventoryRequestClean[]> => {
        const { tenantId } = await tenantContext();

        let query = supabase
            .from('inventory_requests')
            .select('*')
            .eq('tenant_id', tenantId);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return ((data as any[]) || []).map(mapRequest);
    },

    // Get My Requests (User)
    getMyRequests: async (uid: string, institutionId?: string | number): Promise<InventoryRequestClean[]> => {
        const { tenantId } = await tenantContext();

        let query = supabase
            .from('inventory_requests')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('requested_by', uid);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return ((data as any[]) || []).map(mapRequest);
    },

    // Approve Request (Admin)
    approve: async (id: string | number, adminUid: string) => {
        const { tenantId } = await tenantContext();

        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: 'approved' })
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    // Reject Request (Admin)
    reject: async (id: string | number, reason: string) => {
        const { tenantId } = await tenantContext();

        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: 'rejected', reject_reason: reason })
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    // Mark as Issued
    markAsIssued: async (id: string | number, issueId: string | number) => {
        const { tenantId } = await tenantContext();

        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: 'issued', issue_id: issueId })
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    }
};
