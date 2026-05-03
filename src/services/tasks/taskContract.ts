import { z } from 'zod';

export const MediaTaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'todo', 'in_progress', 'on_hold', 'review', 'done']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    dueDate: z.string().optional(),
    due_date: z.any().optional(), // Legacy alias
    institutionId: z.string(),
    institution_id: z.string().optional(), // Legacy alias
    departmentId: z.string().optional(),
    department_id: z.string().optional(), // Legacy alias
    assignedTo: z.array(z.object({
        uid: z.string(),
        name: z.string(),
        avatarUrl: z.string().optional(),
    })).optional(),
    assigned_to: z.any().optional(), // Legacy alias
    createdBy: z.object({
        uid: z.string(),
        name: z.string(),
        role: z.string(),
    }),
    created_by: z.any().optional(), // Legacy alias
    assignedBy: z.object({
        uid: z.string(),
        name: z.string(),
    }).optional(),
    assigned_by: z.any().optional(), // Legacy alias
    updatedBy: z.object({
        uid: z.string(),
        name: z.string(),
    }).optional(),
    updated_by: z.any().optional(), // Legacy alias
    createdAt: z.string(),
    created_at: z.any().optional(), // Legacy alias
    updatedAt: z.string().optional(),
    updated_at: z.any().optional(), // Legacy alias
    completedAt: z.string().optional(),
    completed_at: z.any().optional(), // Legacy alias
    mediaUploaded: z.boolean().optional(),
    media_uploaded: z.boolean().optional(), // Legacy alias
    mediaApproved: z.boolean().optional(),
    media_approved: z.boolean().optional(), // Legacy alias
    mediaApprovedDate: z.string().optional(),
    media_approved_date: z.any().optional(), // Legacy alias
    deleted: z.boolean().optional(),
    isOverdue: z.boolean().optional(),
    isDueToday: z.boolean().optional(),
    isUpcoming: z.boolean().optional(),
    is_demo_data: z.boolean().optional(),
    event_id: z.string().uuid().optional(),
    version: z.number().optional().default(1),
});

export type MediaTask = z.infer<typeof MediaTaskSchema>;
