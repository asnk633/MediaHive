import { z } from 'zod';

// Task form validation schema
export const taskFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title must be at most 150 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional().nullable(),
  due_date: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  priority: z.enum(['Urgent', 'High', 'Medium', 'Low']),
  assignedToId: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

// Notification form validation schema
export const notificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title must be at most 150 characters'),
  body: z.string().min(1, 'Body is required').max(2000, 'Body must be at most 2000 characters'),
  audience: z.array(z.enum(['all', 'admins', 'team', 'guests'])).min(1, 'At least one audience is required'),
  schedule: z.string().optional().nullable(),
  media: z.string().optional().nullable(),
});

// Type inference
export type TaskFormData = z.infer<typeof taskFormSchema>;
export type NotificationFormData = z.infer<typeof notificationFormSchema>;
