import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string(),
    uid: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    full_name: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    role: z.enum(['admin', 'team', 'guest', 'manager']).optional().nullable(),
    institution_id: z.union([z.string(), z.number()]).optional().nullable(),
    department_id: z.union([z.string(), z.number()]).optional().nullable(),
    avatar_url: z.string().optional().nullable(),
    photoURL: z.string().optional().nullable(),
    isActive: z.boolean().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    tenant_id: z.union([z.string(), z.number()]).optional().nullable(),
});

export type UserDTO = z.infer<typeof UserSchema>;
