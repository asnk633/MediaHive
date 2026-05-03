/**
 * Campaign Service — Services Layer
 * 
 * Canonical service for all campaign data access.
 * This replaces direct imports from features/campaigns for cross-feature consumers.
 */

import { CampaignItem, mapCampaign } from './campaignContract';
import { supabase } from '@/lib/supabaseClient';
import { CampaignSchema } from '@/domain/schemas/campaign';
import { tenantContext } from '@/lib/auth/tenantContext';

export type { CampaignItem } from './campaignContract';
export type { CampaignPhase } from './campaignContract';

export const campaignService = {
    /**
     * Fetch all campaigns, optionally filtered by status/phase.
     * Returns canonicalized CampaignItem objects.
     */
    async getCampaigns(params: { status?: string; phase?: string } = {}): Promise<CampaignItem[]> {
        const { tenantId } = await tenantContext();

        let query = supabase
            .from('campaigns')
            .select('*')
            .eq('tenant_id', tenantId);

        if (params.status) query = query.eq('status', params.status);
        if (params.phase) query = query.eq('phase', params.phase);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error("[CampaignService] Error fetching campaigns:", error);
            return [];
        }

        // DTO Validation
        return ((data as any[]) || []).map((item: any) => {
            const parsed = CampaignSchema.safeParse(item);
            if (!parsed.success) {
                console.warn("[CampaignService] DTO validation failed for campaign:", parsed.error);
                // We still return mapCampaign(item) to avoid breaking UI, but log the violation
            }
            return mapCampaign(item);
        });
    },

    /**
     * Fetch a single campaign by ID.
     */
    async getCampaign(id: string): Promise<CampaignItem | null> {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single();

            if (error) throw error;
            if (!data) return null;

            // DTO Validation
            const parsed = CampaignSchema.safeParse(data);
            if (!parsed.success) {
                console.warn("[CampaignService] DTO validation failed for single campaign:", parsed.error);
            }

            return mapCampaign(data);
        } catch {
            return null;
        }
    },

    /**
     * Create a new campaign.
     */
    async create(data: Partial<CampaignItem>): Promise<CampaignItem> {
        const { tenantId, userId } = await tenantContext();

        const { data: newCampaign, error } = await supabase
            .from('campaigns')
            .insert([{
                ...data,
                tenant_id: tenantId,
                created_by_id: userId,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return mapCampaign(newCampaign);
    },
};
