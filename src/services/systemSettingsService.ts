import { logSystemActivity } from "@/lib/server/activity-logger";
import { supabase } from "@/lib/supabaseClient";
import { withTenant } from "@/lib/tenantQuery";

const TABLE = "system_settings";

export interface SystemSettings {
    allowGuestTasks: boolean;
    publicFilesDefault: boolean;
    driveAutoScan: boolean;
    lastUpdated?: string;
    updated_by?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
    allowGuestTasks: true,
    publicFilesDefault: true,
    driveAutoScan: true
};

export const systemSettingsService = {
    /**
     * Get system settings for a specific tenant. Returns defaults if not initialized.
     */
    getSettings: async (tenantId: string | number): Promise<SystemSettings> => {
        try {
            if (!tenantId) {
                return DEFAULT_SETTINGS;
            }

            const { data, error } = await withTenant(
                supabase
                    .from(TABLE)
                    .select('*'),
                String(tenantId)
            )
                .single();

            if (error || !data) {
                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error("[SystemSettings] Fetch error:", error);
                }
                return DEFAULT_SETTINGS;
            }

            return { ...DEFAULT_SETTINGS, ...data } as SystemSettings;
        } catch (error) {
            console.error("[SystemSettings] Failed to fetch settings:", error);
            return DEFAULT_SETTINGS;
        }
    },

    /**
     * Update a system setting and log the action.
     */
    updateSetting: async (
        key: keyof SystemSettings,
        value: any,
        adminUid: string,
        tenantId: string | number,
        adminName: string = 'Admin'
    ): Promise<boolean> => {
        try {
            if (!tenantId) {
                throw new Error("Tenant ID is required to update settings");
            }

            const { error } = await withTenant(
                supabase
                    .from(TABLE)
                    .upsert({
                        [key]: value,
                        updated_at: new Date().toISOString(),
                        updated_by: adminUid,
                        tenant_id: tenantId
                    }),
                String(tenantId)
            );

            if (error) throw error;

            // Critical Audit Log
            await logSystemActivity({
                actorId: adminUid,
                actorRole: 'admin',
                action: 'security_rule_updated',
                entityType: 'system_setting',
                entityId: 'global_settings',
                summary: `Security Rule Updated: ${key} changed to ${value}`,
                severity: 'critical',
                source: 'admin_console',
                metadata: {
                    setting: key,
                    newValue: value,
                    updated_by: adminName
                }
            });

            return true;
        } catch (error) {
            console.error("[SystemSettings] Failed to update setting:", error);
            throw new Error("Failed to update system setting");
        }
    }
};
