import { z } from 'zod';

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional().nullable(),
    status: z.enum(['pending', 'todo', 'in_progress', 'on_hold', 'review', 'done']).optional().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
    dueDate: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    institutionId: z.string().optional().nullable(),
    institution_id: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    department_id: z.string().optional().nullable(),
    assignedTo: z.any().optional().nullable(),
    assigned_to: z.any().optional().nullable(),
    createdBy: z.any().optional().nullable(),
    created_by: z.any().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    completedAt: z.string().optional().nullable(),
    completed_at: z.string().optional().nullable(),
    tenant_id: z.string().optional().nullable(),
    event_id: z.string().optional().nullable(),
    production_stage: z.enum(['planning', 'preparation', 'shooting', 'editing', 'delivery']).optional().nullable(),
    version: z.number().optional().nullable(),
    updated_by: z.string().optional().nullable(),
});

export type TaskDTO = z.infer<typeof TaskSchema>;
