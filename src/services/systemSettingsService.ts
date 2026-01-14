import { adminDb } from "@/lib/firebase/server";
import { logSystemActivity } from "@/lib/server/activity-logger";
import { FieldValue } from "firebase-admin/firestore";

const SETTINGS_COLLECTION = "system_settings";
const GLOBAL_DOC_ID = "global";

export interface SystemSettings {
    allowGuestTasks: boolean;
    publicFilesDefault: boolean;
    driveAutoScan: boolean;
    lastUpdated?: string;
    updatedBy?: string;
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
            const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(GLOBAL_DOC_ID).get();
            if (doc.exists) {
                return { ...DEFAULT_SETTINGS, ...doc.data() } as SystemSettings;
            }
            return DEFAULT_SETTINGS;
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
            const settingsRef = adminDb.collection(SETTINGS_COLLECTION).doc(GLOBAL_DOC_ID);

            await settingsRef.set({
                [key]: value,
                updatedAt: FieldValue.serverTimestamp(),
                updatedBy: adminUid
            }, { merge: true });

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
                    updatedBy: adminName
                }
            });

            return true;
        } catch (error) {
            console.error("[SystemSettings] Failed to update setting:", error);
            throw new Error("Failed to update system setting");
        }
    }
};
