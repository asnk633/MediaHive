import { z } from 'zod';

export const NotificationSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    type: z.string().nullable(),
    title: z.string(),
    message: z.string().optional().nullable(),
    body: z.string().optional().nullable(),
    entity_type: z.string().optional().nullable(),
    entity_id: z.string().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high']).optional().nullable(),
    read: z.boolean().optional().nullable(),
    created_at: z.string().optional().nullable(),
    tenant_id: z.string().optional().nullable(),
    institution_id: z.string().optional().nullable(),
    department_id: z.number().optional().nullable(),
});

export type NotificationDTO = z.infer<typeof NotificationSchema>;
