import { Campaign, CampaignPhase } from '@/features/campaigns/types/campaign';
import { MediaTask as Task } from '@/services/tasks/taskContract';
import { supabase } from '@/lib/supabaseClient';

import { offlineDB } from '@/lib/offline/db';

export type CreateCampaignData = Partial<Campaign>;

export const CampaignService = {
    /**
     * Create a new campaign.
     * Guests default to 'planning' phase.
     */
    async createCampaign(data: Partial<Campaign>, user: { uid: string, role: string, name: string }) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Unauthorized");

        const tenantId = session.user.app_metadata.tenant_id || session.user.user_metadata.tenant_id;

        const campaignData = {
            ...data,
            tenant_id: tenantId,
            owner_id: user.uid,
            created_by_info: {
                uid: user.uid,
                role: user.role,
                name: user.name
            },
            phase: 'planning',
            members: [user.uid],
        };

        const { data: newCampaign, error } = await supabase
            .from('campaigns')
            .insert([campaignData])
            .select()
            .single();

        if (error) throw error;
        return newCampaign.id;
    },

    /**
     * Get campaigns relevant to the user.
     */
    async getCampaigns(user?: { uid: string, role: string }, institution_id?: string): Promise<Campaign[]> {
        try {
            let query = supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (institution_id) {
                query = query.eq('institution_id', institution_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Update Cache
            if (data) {
                const cacheKey = institution_id ? `campaigns:${institution_id}` : 'campaigns';
                await offlineDB.setCache(cacheKey, data);
            }

            return data || [];
        } catch (error) {
            const cacheKey = institution_id ? `campaigns:${institution_id}` : 'campaigns';
            console.warn("[CampaignService] Network error, checking cache:", error);
            const cached = await offlineDB.getCache<Campaign[]>(cacheKey);
            return cached || [];
        }
    },

    async getCampaign(id: string): Promise<Campaign | null> {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data || null;
        } catch (error) {
            console.warn("[CampaignService] Network error for ID, checking cache:", error);
            // Search all campaigns caches if needed, or just default
            const cached = await offlineDB.getCache<Campaign[]>('campaigns');
            return cached?.find(c => c.id === id) || null;
        }
    },

    /**
     * Update campaign with strict permission checks.
     */
    async updateCampaign(id: string, updates: Partial<Campaign>, user: { uid: string, role: string }) {
        const { error } = await supabase
            .from('campaigns')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteCampaign(id: string, user: { role: string }) {
        if (!['admin', 'team'].includes(user.role)) {
            throw new Error("Unauthorized: Only Admin/Team can delete campaigns");
        }

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get tasks linked to a campaign
     */
    async getCampaignTasks(campaign_id: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('campaign_id', campaign_id);

        if (error) {
            console.error("[CampaignService] Error fetching campaign tasks:", error);
            return [];
        }
        return data || [];
    },

    async linkTaskToCampaign(taskId: string, campaign_id: string) {
        const { error } = await supabase
            .from('tasks')
            .update({ campaign_id })
            .eq('id', taskId);

        if (error) throw error;
    },

    async unlinkTaskFromCampaign(taskId: string) {
        const { error } = await supabase
            .from('tasks')
            .update({ campaign_id: null })
            .eq('id', taskId);

        if (error) throw error;
    }
};
