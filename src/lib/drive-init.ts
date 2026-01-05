import { getDriveClient, ensureFolderPath, DRIVE_CONFIG, sanitizeForDrive } from './drive';
import 'server-only';
import { adminDb } from '@/lib/firebase/server';

const CACHE_DOC_PATH = 'config/drive';

interface DriveFolderConfig {
    rootFolderId: string;
    campaignsFolderId: string;
    standaloneTasksFolderId: string;
    lastUpdated: number;
}

export async function initializeDriveStructure(): Promise<DriveFolderConfig> {
    const db = adminDb;
    const drive = await getDriveClient();

    // 1. Check Cache
    const docRef = db.doc(CACHE_DOC_PATH);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        const data = docSnap.data() as DriveFolderConfig;
        // Optional: Verify if folders actually exist?
        // For performance, we trust the cache unless explicitly running a "repair" mode.
        // But for robust init, let's just return if we have the IDs.
        if (data.rootFolderId && data.campaignsFolderId && data.standaloneTasksFolderId) {
            console.log("Drive structure cached:", data);
            return data;
        }
    }

    console.log("Initializing Drive folder structure...");

    // 2. Ensure Root "MediaHive"
    // We search/create inside the configured parent folder (DRIVE_CONFIG.folderId)
    // If DRIVE_CONFIG.folderId is set, "MediaHive" is a subfolder of THAT.
    // If DRIVE_CONFIG.folderId is NOT set (e.g. root of My Drive), we assume root.
    // However, existing setup suggests DRIVE_CONFIG.folderId IS the effective root for the app?
    // User request says: "MediaHive/ -> Campaigns/, Standalone Tasks/"

    // Let's assume we create "MediaHive" inside the configured Shared Drive/Folder ID.
    // Reusing ensureFolderPath logic.

    const rootParentId = DRIVE_CONFIG.folderId || 'root';

    const mediaHiveId = await ensureFolderPath(drive, rootParentId, ['MediaHive']);

    // 3. Ensure Subfolders
    // We want MediaHive/Campaigns and MediaHive/Standalone Tasks
    const campaignsId = await ensureFolderPath(drive, mediaHiveId, ['Campaigns']);
    const standaloneTasksId = await ensureFolderPath(drive, mediaHiveId, ['Standalone Tasks']);

    // 4. Update Cache
    const config: DriveFolderConfig = {
        rootFolderId: mediaHiveId,
        campaignsFolderId: campaignsId,
        standaloneTasksFolderId: standaloneTasksId,
        lastUpdated: Date.now()
    };

    await docRef.set(config);
    console.log("Drive structure initialized and cached:", config);

    return config;
}

/**
 * Ensures a Drive folder exists for the given Campaign.
 * Uses lazy creation: Checks Firestore first, if missing, creates in Drive and updates Firestore.
 */

export async function ensureCampaignFolder(campaignId: string, campaignName: string): Promise<string> {
    const db = adminDb;
    const drive = await getDriveClient();

    // 1. Check Campaign Doc for existing ID
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
        throw new Error(`Campaign ${campaignId} not found`);
    }

    const campaignData = campaignSnap.data();
    if (campaignData?.driveFolderId) {
        return campaignData.driveFolderId;
    }

    // 2. Not found, create it.
    // Need parent folder ID (MediaHive/Campaigns)
    let campaignsRootId: string;

    // Try to get from cache
    const cacheRef = db.doc(CACHE_DOC_PATH);
    const cacheSnap = await cacheRef.get();

    if (cacheSnap.exists && cacheSnap.data()?.campaignsFolderId) {
        campaignsRootId = cacheSnap.data()?.campaignsFolderId;
    } else {
        // Fallback: Init structure if missing
        const config = await initializeDriveStructure();
        campaignsRootId = config.campaignsFolderId;
    }

    // 3. Create Campaign Folder
    // Use sanitized name or just raw name? ensureFolderPath handles basic existence check.
    // We want a folder named options.campaignName inside campaignsRootId.
    const safeName = sanitizeForDrive(campaignName);
    const folderId = await ensureFolderPath(drive, campaignsRootId, [safeName]);

    // 4. Update Campaign Doc
    await campaignRef.update({ driveFolderId: folderId });
    console.log(`Created Drive folder for Campaign ${campaignId}: ${folderId}`);

    return folderId;
}

export async function getStandaloneTasksFolderId(): Promise<string> {
    const db = adminDb;

    const cacheRef = db.doc(CACHE_DOC_PATH);
    const cacheSnap = await cacheRef.get();

    if (cacheSnap.exists && cacheSnap.data()?.standaloneTasksFolderId) {
        return cacheSnap.data()?.standaloneTasksFolderId;
    }

    const config = await initializeDriveStructure();
    return config.standaloneTasksFolderId;
}

/**
 * Ensures a dedicated Drive folder exists for a Task.
 * Logic:
 * - Checks Task Doc for existing driveFolderId.
 * - If missing:
 *   - If Campaign Task: Ensure Campaign Folder -> Create Task Folder inside.
 *   - If Standalone: Get Standalone Root -> Create Task Folder inside.
 * - Updates Task Doc.
 */
export async function ensureTaskFolder(taskId: string, taskTitle: string, campaignId?: string): Promise<string> {
    const db = adminDb;
    const drive = await getDriveClient();

    // 1. Check Task Doc
    const taskRef = db.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
        throw new Error(`Task ${taskId} not found`);
    }

    const taskData = taskSnap.data();
    if (taskData?.driveFolderId) {
        return taskData.driveFolderId;
    }

    // 2. Determine Parent Folder
    let parentFolderId: string;

    // Prefer argument, fallback to task data
    const effectiveCampaignId = campaignId || taskData?.campaignId;

    if (effectiveCampaignId) {
        // Need Campaign Name to ensure folder
        const campaignSnap = await db.collection('campaigns').doc(effectiveCampaignId).get();
        // If campaign doesn't exist (deleted?), fallback to Standalone or create "Untitled Campaign" folder? 
        // Safer to fallback to Standalone if campaign missing to prevent error loop.
        if (campaignSnap.exists) {
            const campaignName = campaignSnap.data()?.name || "Untitled Campaign";
            parentFolderId = await ensureCampaignFolder(effectiveCampaignId, campaignName);
        } else {
            console.warn(`Campaign ${effectiveCampaignId} not found for Task ${taskId}, falling back to Standalone.`);
            parentFolderId = await getStandaloneTasksFolderId();
        }
    } else {
        parentFolderId = await getStandaloneTasksFolderId();
    }

    // 3. Create Task Folder
    // Sanitize name
    const safeTitle = sanitizeForDrive(taskTitle || "Untitled Task");
    const folderName = safeTitle; // We can append ID if needed, but per requirements "Task Title"

    const folderId = await ensureFolderPath(drive, parentFolderId, [folderName]);

    // 4. Update Task Doc
    await taskRef.update({ driveFolderId: folderId });
    console.log(`Created Drive folder for Task ${taskId}: ${folderId}`);

    return folderId;
}
