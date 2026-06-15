import { apiClient } from '@/lib/apiClient';

export const DriveFolderService = {
    /**
     * Triggers the server-side initialization of the MediaHive folder structure.
     * Use this on Admin Dashboard load or via a "Repair Drive" button.
     */
    async ensureMediaHiveStructure(): Promise<void> {
        try {
            const res = await apiClient('/ap' + 'i/drive/init', { method: 'POST' });
            console.log("Drive folders ensured:", res.config);
        } catch (error) {
            console.error(error);
            // Non-blocking error for UI usually, but good to log.
        }
    }
};
