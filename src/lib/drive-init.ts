import { getDriveClient, ensureFolderPath, DRIVE_CONFIG, sanitizeForDrive } from './drive';
import 'server-only';
import { getSupabaseAdmin } from '@/lib/server-utils';

const CONFIG_TABLE = 'app_config';
const DRIVE_CONFIG_KEY = 'drive_structure';

interface DriveFolderConfig {
    root_folder_id: string;
    campaigns_folder_id: string;
    standalone_tasks_folder_id: string;
    last_updated: string;
}

export async function initializeDriveStructure(): Promise<DriveFolderConfig> {
    const drive = await getDriveClient();
    const supabase = getSupabaseAdmin();

    try {
        const { data: configRow } = await supabase
            .from(CONFIG_TABLE)
            .select('value')
            .eq('key', DRIVE_CONFIG_KEY)
            .maybeSingle();

        if (configRow?.value) {
            const data = configRow.value as DriveFolderConfig;
            if (data.root_folder_id && data.campaigns_folder_id && data.standalone_tasks_folder_id) {
                return data;
            }
        }
    } catch (e) {
        console.warn('Drive config cache inaccessible.');
    }

    const rootParentId = DRIVE_CONFIG.folderId || 'root';
    const mediaHiveId = await ensureFolderPath(drive, rootParentId, ['MediaHive']);
    const campaignsId = await ensureFolderPath(drive, mediaHiveId, ['Campaigns']);
    const standaloneTasksId = await ensureFolderPath(drive, mediaHiveId, ['Standalone Tasks']);

    const config: DriveFolderConfig = {
        root_folder_id: mediaHiveId,
        campaigns_folder_id: campaignsId,
        standalone_tasks_folder_id: standaloneTasksId,
        last_updated: new Date().toISOString()
    };

    try {
        await supabase
            .from(CONFIG_TABLE)
            .upsert({
                key: DRIVE_CONFIG_KEY,
                value: config,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
    } catch (e) {
        // Cache write is optional
    }

    return config;
}

export async function ensureCampaignFolder(campaign_id: string, campaignName: string): Promise<string> {
    const drive = await getDriveClient();
    const supabase = getSupabaseAdmin();

    const { data: campaign } = await supabase
        .from('campaigns')
        .select('drive_folder_id')
        .eq('id', campaign_id)
        .maybeSingle();

    if (campaign?.drive_folder_id) {
        return campaign.drive_folder_id;
    }

    const config = await initializeDriveStructure();
    const campaignsRootId = config.campaigns_folder_id;

    const safeName = sanitizeForDrive(campaignName);
    const folderId = await ensureFolderPath(drive, campaignsRootId, [safeName]);

    await supabase
        .from('campaigns')
        .update({ drive_folder_id: folderId })
        .eq('id', campaign_id);

    return folderId;
}

export async function getStandaloneTasksFolderId(): Promise<string> {
    const config = await initializeDriveStructure();
    return config.standalone_tasks_folder_id;
}

export async function ensureTaskFolder(taskId: string, taskTitle: string, campaign_id?: string): Promise<string> {
    const drive = await getDriveClient();
    const supabase = getSupabaseAdmin();

    const { data: task } = await supabase
        .from('tasks')
        .select('drive_folder_id, campaign_id')
        .eq('id', taskId)
        .maybeSingle();

    if (task?.drive_folder_id) {
        return task.drive_folder_id;
    }

    let parentFolderId: string;
    const effectiveCampaignId = campaign_id || task?.campaign_id;

    if (effectiveCampaignId) {
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('name')
            .eq('id', effectiveCampaignId)
            .maybeSingle();

        if (campaign) {
            parentFolderId = await ensureCampaignFolder(effectiveCampaignId, campaign.name || "Untitled Campaign");
        } else {
            parentFolderId = await getStandaloneTasksFolderId();
        }
    } else {
        parentFolderId = await getStandaloneTasksFolderId();
    }

    const safeTitle = sanitizeForDrive(taskTitle || "Untitled Task");
    const folderId = await ensureFolderPath(drive, parentFolderId, [safeTitle]);

    await supabase
        .from('tasks')
        .update({ drive_folder_id: folderId })
        .eq('id', taskId);

    return folderId;
}

