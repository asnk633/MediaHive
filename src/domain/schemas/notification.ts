import { z } from 'zod';

export const NotificationSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    entity_type: z.string().optional(),
    entity_id: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    read: z.boolean().optional(),
    created_at: z.string().optional(),
    tenant_id: z.string().optional(),
});

export type NotificationDTO = z.infer<typeof NotificationSchema>;
