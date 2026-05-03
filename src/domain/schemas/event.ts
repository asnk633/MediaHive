import { z } from 'zod';

export const EventSchema = z.object({
    id: z.string(),
    title: z.string(),
    startTime: z.string().optional().nullable(),
    start_time: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    end_time: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    institutionId: z.string().optional().nullable(),
    institution_id: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    start_at: z.string().optional().nullable(),
    end_at: z.string().optional().nullable(),
    tenant_id: z.string().optional().nullable(),
    production_stage: z.enum(['planning', 'preparation', 'shooting', 'editing', 'delivery']).optional().default('planning'),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    version: z.number().optional().nullable(),
    updated_by: z.string().optional().nullable(),
});

export type EventDTO = z.infer<typeof EventSchema>;
