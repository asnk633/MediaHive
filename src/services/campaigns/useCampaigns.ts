'use client';
/**
 * useCampaigns — Services Layer Hook
 * 
 * Canonical hook for fetching campaign data.
 * Wraps campaignService.getCampaigns() with React Query.
 * Use this instead of features/campaigns/hooks/useCampaigns.
 */
import { useQuery } from '@tanstack/react-query';
import { campaignService } from './campaignService';
import { useAuthQueryGuard } from '@/hooks/useAuthQueryGuard';

export function useCampaigns(params: { phase?: string } = {}) {
    const { canFetch } = useAuthQueryGuard();
    return useQuery({
        queryKey: ['campaigns', params],
        queryFn: () => campaignService.getCampaigns(params),
        enabled: canFetch,
        staleTime: 60_000,
        retry: 1,
        retryDelay: 1000,
    });
}
