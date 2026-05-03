import { z } from 'zod';

export const CampaignSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    phase: z.enum(['planning', 'production', 'review', 'publish', 'completed']).optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    start_date: z.string().optional(),
    endDate: z.string().optional(),
    end_date: z.string().optional(),
    ownerId: z.string().optional(),
    owner_id: z.string().optional(),
    institutionId: z.string().optional(),
    institution_id: z.string().optional(),
    members: z.array(z.string()).optional(),
    tenant_id: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type CampaignDTO = z.infer<typeof CampaignSchema>;
