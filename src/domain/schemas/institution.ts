import { z } from 'zod';

export const InstitutionSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    tenant_id: z.union([z.string(), z.number()]).optional().nullable(),
    status: z.string().optional().nullable(),
    features: z.record(z.string(), z.boolean()).optional().nullable(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
});
