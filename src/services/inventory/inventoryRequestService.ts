import { InventoryRequestClean, InventoryRequestSchema } from "./inventoryContract";
import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { eventBus } from "@/system/events/eventSystem";

function mapRequest(row: any): InventoryRequestClean {
    try {
        const request = {
            id: row.id,
            itemId: row.item_id || row.itemId,
            itemName: row.item_name || row.itemName,
            requestedBy: row.user_id || row.requested_by || row.requestedBy,
            requestedByRole: row.requested_by_role || row.requestedByRole,
            purpose: row.purpose || row.notes,
            notes: row.notes,
            institutionId: row.institution_id || row.institutionId,
            status: row.status,
            rejectReason: row.reject_reason || row.rejectReason,
            issueId: row.issue_id || row.issueId,
            createdAt: row.created_at || row.createdAt,
        };
        const result = InventoryRequestSchema.safeParse(request);
        if (!result.success) {
            console.warn("[InventoryMapping][Request] Validation warning:", result.error.format());
            return request as any as InventoryRequestClean;
        }
        return result.data;
    } catch (e) {
        console.error("[InventoryMapping][Request] Mapping crash:", e, row);
        throw e;
    }
}

/**
 * inventoryRequestService (Direct Supabase Access)
 */
export const inventoryRequestService = {
    // Create Request
    create: async (data: any) => {
        try {
            const { tenantId, userId } = await tenantContext();

            const { data: result, error } = await supabase
                .from('inventory_requests')
                .insert([{
                    user_id: userId,
                    item_name: data.itemName,
                    institution_id: data.institution_id || data.institutionId,
                    tenant_id: tenantId,
                    status: 'pending',
                    notes: data.purpose || data.notes,
                    created_at: new Date().toISOString()
                }])
                .select('id')
                .single();

            if (error) {
                console.error("[inventoryRequestService] create error:", JSON.stringify(error, null, 2));
                throw error;
            }
            return result.id;
        } catch (err) {
            console.error("[inventoryRequestService] create uncaught:", JSON.stringify(err, null, 2));
            throw err;
        }
    },

    // Get All Requests (Admin)
    getAll: async (institutionId?: string | number): Promise<InventoryRequestClean[]> => {
        try {
            const { tenantId } = await tenantContext();

            let query = supabase
                .from('inventory_requests')
                .select('*')
                .eq('tenant_id', tenantId);

            if (institutionId) {
                query = query.eq('institution_id', institutionId);
            }

            const { data, error } = await query;
            if (error) {
                console.error("[inventoryRequestService] getAll query error:", JSON.stringify(error, null, 2));
                throw error;
            }

            console.log(`[inventoryRequestService] getAll found ${data?.length || 0} rows`);
            return ((data as any[]) || []).map(mapRequest);
        } catch (err) {
            console.error("[inventoryRequestService] getAll uncaught:", JSON.stringify(err, null, 2));
            throw err;
        }
    },

    // Get My Requests (User)
    getMyRequests: async (uid: string, institutionId?: string | number): Promise<InventoryRequestClean[]> => {
        try {
            const { tenantId } = await tenantContext();

            let query = supabase
                .from('inventory_requests')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('user_id', uid);

            if (institutionId) {
                query = query.eq('institution_id', institutionId);
            }

            const { data, error } = await query;
            if (error) {
                console.error("[inventoryRequestService] getMyRequests error:", JSON.stringify(error, null, 2));
                throw error;
            }

            console.log(`[inventoryRequestService] getMyRequests found ${data?.length || 0} rows for ${uid}`);
            return ((data as any[]) || []).map(mapRequest);
        } catch (err) {
            console.error("[inventoryRequestService] getMyRequests uncaught:", JSON.stringify(err, null, 2));
            throw err;
        }
    },

    // Approve Request (Admin)
    approve: async (id: string | number, adminUid: string) => {
        const { tenantId } = await tenantContext();

        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: 'approved' })
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error("[InventoryService] Approve error:", JSON.stringify(error, null, 2));
            throw error;
        }
    },

    // Reject Request (Admin)
    reject: async (id: string | number, reason: string) => {
        const { tenantId } = await tenantContext();
        console.log("[InventoryService] Rejecting request:", id);

        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: 'rejected', reject_reason: reason })
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error("[InventoryService] Reject error:", JSON.stringify(error, null, 2));
            throw error;
        }
    },

    // Mark as Issued
    markAsIssued: async (id: string | number, issueId: string | number) => {
        const { tenantId } = await tenantContext();

        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: 'issued', issue_id: issueId })
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error("[InventoryService] MarkAsIssued error:", JSON.stringify(error, null, 2));
            throw error;
        }
    }
};
