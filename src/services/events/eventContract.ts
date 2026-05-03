import { z } from 'zod';

export const EventItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    startTime: z.string(),
    endTime: z.string().optional(),
    type: z.string(),
    institutionId: z.string().optional(),
    description: z.string().optional(),
    production_stage: z.enum(['planning', 'preparation', 'shooting', 'editing', 'delivery']).optional().default('planning'),
    version: z.number().optional().default(1),
    updatedBy: z.object({
        uid: z.string(),
        name: z.string(),
    }).optional(),
});

export type EventItem = z.infer<typeof EventItemSchema>;
