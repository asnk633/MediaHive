import { InventoryIssueClean, InventoryIssueSchema } from "./inventoryContract";
import { supabase } from "@/lib/supabaseClient";
import { eventBus } from "@/system/events/eventSystem";
import { tenantContext } from '@/lib/auth/tenantContext';

const TABLE = "inventory_issues";

function mapIssue(row: any): InventoryIssueClean {
    const issue = {
        id: row.id,
        itemId: row.item_id || row.itemId,
        itemName: row.item_name || row.itemName,
        issuedToUserId: row.issued_to_user_id || row.issuedToUserId,
        issuedToRole: row.issued_to_role || row.issuedToRole,
        issuedBy: row.issued_by || row.issuedBy,
        institutionId: row.institution_id || row.institutionId,
        status: row.status,
        conditionOut: row.condition_out || row.conditionOut,
        conditionIn: row.condition_in || row.conditionIn,
        issuedAt: row.issued_at || row.issuedAt,
        expectedReturnAt: row.expected_return_at || row.expectedReturnAt,
        returnedAt: row.returned_at || row.returnedAt,
        issuedToDeptId: row.issued_to_dept_id || row.issuedToDeptId,
        tenantId: row.tenant_id || row.tenantId
    };
    const result = InventoryIssueSchema.safeParse(issue);
    if (!result.success) {
        console.error("[InventoryMapping][Issue] Validation failed:", result.error.format());
        return issue as InventoryIssueClean;
    }
    return result.data;
}

export const inventoryIssueService = {
    // Issue Item (Admin/Team)
    create: async (data: any) => {
        try {
            const { tenantId, userId } = await tenantContext();

            const payload = {
                item_id: data.itemId,
                item_name: data.itemName,
                issued_to_user_id: data.issuedToUserId,
                issued_to_dept_id: data.issuedToDeptId,
                issued_to_role: data.issuedToRole,
                issued_by: userId,
                institution_id: data.institutionId,
                tenant_id: tenantId,
                status: 'issued',
                issued_at: new Date().toISOString(),
                condition_out: data.conditionOut,
                expected_return_at: data.expectedReturnAt,
            };

            const { data: created, error } = await supabase
                .from(TABLE)
                .insert([payload])
                .select('id')
                .single() as { data: any; error: any };

            if (error) {
                console.error("[InventoryIssueService] Create error:", error);
                throw new Error(error.message || "Failed to create inventory issue");
            }

            // Emit event (Replaces direct notification call)
            eventBus.emit('inventory.issued', {
                itemId: data.itemId,
                userId: data.issuedToUserId,
                deptId: data.issuedToDeptId,
                issueId: created.id
            });

            return created.id;
        } catch (err: any) {
            console.error("[InventoryIssueService] create UNCAUGHT THROW:", err);
            throw (err instanceof Error) ? err : new Error(err?.message || String(err));
        }
    },

    // Get Active Issues
    getActiveIssues: async (): Promise<InventoryIssueClean[]> => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq("tenant_id", tenantId)
                .eq("status", "issued");

            if (error) {
                console.error("[InventoryIssueService] getActiveIssues error:", error);
                throw new Error(error.message || "Failed to fetch inventory issues");
            }

            return ((data as any[]) || []).map(mapIssue);
        } catch (err: any) {
            console.error("[InventoryIssueService] getActiveIssues UNCAUGHT THROW:", err);
            throw (err instanceof Error) ? err : new Error(err?.message || String(err));
        }
    },

    // Get All Issues (History)
    getAll: async (): Promise<InventoryIssueClean[]> => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq("tenant_id", tenantId)
                .order("issued_at", { ascending: false });

            if (error) {
                console.error("[InventoryIssueService] getAll error:", error);
                throw new Error(error.message || "Failed to fetch inventory history");
            }

            return ((data as any[]) || []).map(mapIssue);
        } catch (err: any) {
            console.error("[InventoryIssueService] getAll UNCAUGHT THROW:", err);
            throw (err instanceof Error) ? err : new Error(err?.message || String(err));
        }
    },

    // Return Item
    returnItem: async (id: string | number, conditionIn: string, returnedAt: Date, remarks?: string) => {
        try {
            const { tenantId } = await tenantContext();

            const { data: issueData, error: fetchError } = await supabase
                .from(TABLE)
                .select('*')
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single();

            if (fetchError) {
                throw new Error(fetchError.message || "Failed to fetch issue for return");
            }

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
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (updateError) {
                throw new Error(updateError.message || "Failed to update issue status");
            }

            if (issueData) {
                const mapped = mapIssue(issueData);
                // Emit event
                eventBus.emit('inventory.returned', {
                    itemId: String(mapped.itemId),
                    issueId: String(id)
                });
            }
        } catch (err: any) {
            console.error("[InventoryIssueService] returnItem UNCAUGHT THROW:", err);
            throw (err instanceof Error) ? err : new Error(err?.message || String(err));
        }
    }
};

