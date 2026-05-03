import { Campaign, CampaignPhase } from '@/types/campaign';
import { Task } from '@/types/task';
import { apiClient } from '@/lib/apiClient';

export const CampaignService = {
    /**
     * Create a new campaign.
     * Guests default to 'planning' phase.
     */
    async createCampaign(data: Partial<Campaign>, user: { uid: string, role: string, name: string }) {
        const campaignData = {
            ...data,
            ownerId: user.uid,
            created_by: {
                uid: user.uid,
                role: user.role as any,
                name: user.name
            },
            phase: 'planning', // Force 'planning' initially for everyone, or allow Admin override if needed. Using 'planning' as safe default.
            members: [user.uid], // Owner is always a member
        };

        const response = await apiClient('/api/campaigns', {
            method: 'POST',
            body: JSON.stringify(campaignData)
        });

        return response.id;
    },

    /**
     * Get campaigns relevant to the user.
     * Admin: All
     * Team: Campaigns they are members of (or we could show all for Team too, depending on open/closed culture. Assuming "All" or "Member" based on reqs. "Team: campaigns they are members of" per prompt)
     * Guest: Only their own campaigns (ownerId or member)
     */
    async getUserCampaigns(): Promise<Campaign[]> {
        const response = await apiClient('/api/campaigns');
        return response.campaigns || [];
    },

    async getCampaign(id: string): Promise<Campaign | null> {
        try {
            const response = await apiClient(`/api/campaigns/${id}`);
            return response.campaign || null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Update campaign with strict permission checks.
     */
    async updateCampaign(id: string, updates: Partial<Campaign>, user: { uid: string, role: string }) {
        await apiClient(`/api/campaigns/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ updates, user })
        });
    },

    async deleteCampaign(id: string, user: { role: string }) {
        if (!['admin', 'team'].includes(user.role)) {
            throw new Error("Unauthorized: Only Admin/Team can delete campaigns");
        }

        await apiClient(`/api/campaigns/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get tasks linked to a campaign
     */
    async getCampaignTasks(campaign_id: string): Promise<Task[]> {
        const response = await apiClient(`/api/campaigns/${campaign_id}/tasks`);
        return response.tasks || [];
    },

    async linkTaskToCampaign(taskId: string, campaign_id: string) {
        await apiClient('/api/campaigns/link-task', {
            method: 'POST',
            body: JSON.stringify({ taskId, campaign_id })
        });
    },

    async unlinkTaskFromCampaign(taskId: string) {
        await apiClient('/api/campaigns/unlink-task', {
            method: 'POST',
            body: JSON.stringify({ taskId })
        });
    }
};
