import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CampaignService, CreateCampaignData } from '@/features/campaigns/services/campaignService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useAuthQueryGuard } from '@/hooks/useAuthQueryGuard';

// Only runs after auth has fully initialized AND user exists.
export function useCampaigns() {
    const { canFetch } = useAuthQueryGuard();
    console.log('[useCampaigns] hook initialized');
    return useQuery({
        queryKey: ['campaigns'],
        queryFn: async () => {
            console.log('[useCampaigns] queryFn executing');
            return CampaignService.getCampaigns();
        },
        enabled: canFetch,
        staleTime: 60000,
        retry: 1,
        retryDelay: 1000,
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, creator }: { data: CreateCampaignData; creator: any }) =>
            CampaignService.createCampaign(data, creator),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        },
    });
}
