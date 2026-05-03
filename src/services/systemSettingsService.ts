// @ts-nocheck
import { logSystemActivity } from "@/lib/server/activity-logger";
import { supabase } from "@/lib/supabaseClient";

const TABLE = "system_settings";
const GLOBAL_DOC_ID = "global";

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
     * Get global system settings. Returns defaults if not initialized.
     */
    getSettings: async (): Promise<SystemSettings> => {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('id', GLOBAL_DOC_ID)
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
        adminName: string = 'Admin'
    ): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from(TABLE)
                .upsert({
                    id: GLOBAL_DOC_ID,
                    [key]: value,
                    updated_at: new Date().toISOString(),
                    updated_by: adminUid
                });

            if (error) throw error;

            // Critical Audit Log
            await logSystemActivity({
                actorId: adminUid,
                actorRole: 'admin',
                action: 'security_rule_updated',
                entityType: 'system_setting',
                entityId: GLOBAL_DOC_ID,
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
