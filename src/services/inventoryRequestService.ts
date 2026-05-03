import { InventoryRequest } from "@/types/inventory";
import { getSupabaseAdmin } from "@/lib/server-utils";

const TABLE = "device_requests";

/**
 * inventoryRequestService (Supabase-Native)
 * Handles all equipment/device requests using PostgreSQL backend.
 */
export const inventoryRequestService = {
    // Create Request (Guest/User)
    create: async (data: Omit<InventoryRequest, 'id' | 'created_at' | 'status'>) => {
        const supabase = getSupabaseAdmin();
        const payload = {
            ...data,
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        const { data: inserted, error } = await supabase
            .from(TABLE)
            .insert([payload])
            .select('id')
            .single();

        if (error) throw new Error(`Failed to create inventory request: ${error.message}`);
        return inserted.id;
    },

    // Get All Requests (Admin) - Scoped by institution
    getAll: async (institution_id: string) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq("institution_id", institution_id)
            .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch inventory requests: ${error.message}`);
        return data as InventoryRequest[];
    },

    // Get My Requests (User) - Scoped by UID and institution
    getMyRequests: async (uid: string, institution_id: string) => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq("userId", uid)
            .eq("institution_id", institution_id)
            .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch my requests: ${error.message}`);
        return data as InventoryRequest[];
    },

    // Approve Request (Admin)
    approve: async (id: string, adminUid: string) => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from(TABLE)
            .update({
                status: 'approved',
                approvedBy: adminUid,
                approvedAt: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw new Error(`Failed to approve request: ${error.message}`);
    },

    // Reject Request (Admin)
    reject: async (id: string, reason: string) => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from(TABLE)
            .update({
                status: 'rejected',
                rejectionReason: reason
            })
            .eq('id', id);

        if (error) throw new Error(`Failed to reject request: ${error.message}`);
    },

    // Mark as Issued (System/Admin) - Links request to issue record
    markAsIssued: async (id: string, issueId: string) => {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from(TABLE)
            .update({
                status: 'issued',
                issuedIssueId: issueId
            })
            .eq('id', id);

        if (error) throw new Error(`Failed to mark as issued: ${error.message}`);
    }
};
