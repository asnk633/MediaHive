// src/lib/validation.ts
// Zod validation utilities

import { z, ZodError } from 'zod';

// Generic validation error handler
export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Helper function to validate Zod schema and throw formatted errors
export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      });
      
      throw new ValidationError('Validation failed', fieldErrors);
    }
    throw error;
  }
}

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

export const idSchema = z
  .number()
  .int()
  .positive('ID must be a positive integer');

export const optionalIdSchema = z
  .number()
  .int()
  .positive('ID must be a positive integer')
  .optional();

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD');

export const dateTimeStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid datetime format');

// API request validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  role: z.enum(['admin', 'manager', 'team', 'member']),
  institution_id: idSchema,
  tenantId: idSchema,
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  fullName: nameSchema.optional(),
  role: z.enum(['admin', 'manager', 'team', 'member']).optional(),
  institution_id: idSchema.optional(),
  tenantId: idSchema.optional(),
});

export const createTaskSchema = z.object({
  title: nameSchema,
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedToId: optionalIdSchema,
  due_date: dateStringSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: nameSchema.optional(),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedToId: optionalIdSchema,
  due_date: dateStringSchema.optional(),
});

export const createEventSchema = z.object({
  title: nameSchema,
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  startTime: dateTimeStringSchema,
  endTime: dateTimeStringSchema,
});

export const updateEventSchema = z.object({
  title: nameSchema.optional(),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  startTime: dateTimeStringSchema.optional(),
  endTime: dateTimeStringSchema.optional(),
  approval_status: z.enum(['pending', 'approved', 'declined']).optional(),
});

export const createNotificationSchema = z.object({
  userId: idSchema,
  title: nameSchema,
  body: z.string().min(1, 'Body is required').max(1000, 'Body must be at most 1000 characters'),
  channel: z.enum(['ui', 'email', 'realtime']).default('ui'),
  category: z.string().max(50, 'Category must be at most 50 characters').optional(),
  ttl: z.number().int().positive('TTL must be a positive integer').optional(),
});

export const sendNotificationSchema = z.object({
  recipientIds: z.array(idSchema).min(1, 'At least one recipient is required'),
  title: nameSchema,
  body: z.string().min(1, 'Body is required').max(1000, 'Body must be at most 1000 characters'),
  category: z.string().max(50, 'Category must be at most 50 characters').optional(),
});
