import { InventoryIssue, InventoryCondition } from "@/types/inventory";
import { NotificationService } from "@/services/notificationService";
import { supabase } from "@/lib/supabaseClient";

const TABLE = "inventory_issues";

export const inventoryIssueService = {
    // Issue Item (Admin/Team)
    create: async (data: Omit<InventoryIssue, 'id' | 'issuedAt' | 'status'>) => {
        const payload = {
            ...data,
            status: 'issued',
            issued_at: new Date().toISOString(),
        };

        const { data: created, error } = await supabase
            .from(TABLE)
            .insert([payload])
            .select('id')
            .single();

        if (error) {
            console.error("[InventoryIssueService] Create error:", error);
            throw error;
        }

        // Notify User (Async, don't block)
        NotificationService.createNotification({
            user_id: data.issuedToUserId,
            type: 'inventory_issued',
            title: 'Equipment Issued',
            message: `You have been issued "${data.itemName}". Due: ${new Date(data.expectedReturnAt).toLocaleDateString()}.`,
            entity_type: 'device_request', // Using device_request as closest match
            entity_id: created.id,
            priority: 'medium',
            action_url: '/inventory'
        }).catch(err => console.error("Failed to send issue notification", err));

        return created.id;
    },

    // Get Active Issues (For Availability Check)
    getActiveIssues: async (institution_id?: string) => {
        // We only care about items currently 'issued'
        let query = supabase
            .from(TABLE)
            .select('*')
            .eq("status", "issued");

        // Scope by institution if provided (Active Users/Admins should always provide this)
        if (institution_id) {
            query = query.eq("institution_id", institution_id);
        }

        const { data, error } = await query;
        if (error) {
            console.error("[InventoryIssueService] getActiveIssues error:", error);
            return [];
        }

        return data as InventoryIssue[];
    },

    // Get All Issues (History)
    getAll: async (institution_id?: string) => {
        let query = supabase
            .from(TABLE)
            .select('*')
            .order("issued_at", { ascending: false });

        // Scope by institution
        if (institution_id) {
            query = query.eq("institution_id", institution_id);
        }

        const { data, error } = await query;
        if (error) {
            console.error("[InventoryIssueService] getAll error:", error);
            return [];
        }

        return data as InventoryIssue[];
    },

    // Return Item (Admin/Team)
    returnItem: async (id: string, conditionIn: InventoryCondition, returnedAt: Date, remarks?: string) => {
        // 1. Fetch details for notification
        const { data: issueData, error: fetchError } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.warn("Could not fetch issue for notification", fetchError);
        }

        // 2. Update
        const payload: any = {
            status: 'returned',
            condition_in: conditionIn,
            returned_at: returnedAt.toISOString()
        };
        if (remarks) {
            payload.return_remarks = remarks;
        }

        const { error: updateError } = await supabase
            .from(TABLE)
            .update(payload)
            .eq('id', id);

        if (updateError) {
            console.error("[InventoryIssueService] returnItem error:", updateError);
            throw updateError;
        }

        // 3. Notify
        if (issueData) {
            NotificationService.createNotification({
                user_id: issueData.issuedToUserId || issueData.issued_to_user_id,
                type: 'inventory_returned',
                title: 'Item Returned',
                message: `Return confirmed for "${issueData.itemName || issueData.item_name}".`,
                entity_type: 'device_request',
                entity_id: id,
                priority: 'low',
                action_url: '/inventory'
            }).catch(err => console.error("Failed to send return notification", err));
        }
    }
};

