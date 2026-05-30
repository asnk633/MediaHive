import { z } from 'zod';
import { TaskSchema } from '@/domain/schemas/task';
import { EventSchema } from '@/domain/schemas/event';

/**
 * Mutation Schema Registry
 * Defines the strict Zod contracts for every mutation type that enters the offline queue.
 */

// 1. Relational Assignment Schemas
const AssignmentPayloadSchema = z.object({
  task_id: z.string().uuid('Invalid Task UUID'),
  user_id: z.string().uuid('Invalid User UUID'),
  tenant_id: z.string().uuid('Invalid Tenant UUID'),
  role: z.string().optional(),
});

const UnassignmentPayloadSchema = z.object({
  task_id: z.string().uuid('Invalid Task UUID'),
  user_id: z.string().uuid('Invalid User UUID'),
});

// 2. Registry Mapping
export const MutationSchemaRegistry: Record<string, z.ZodType<any>> = {
  // Tasks
  'CREATE_TASK': TaskSchema.extend({
    title: z.string().min(1, 'Title is required'),
    tenant_id: z.string().uuid('Tenant ID is required for creation')
  }),
  'UPDATE_TASK': TaskSchema.partial().extend({
    id: z.string().uuid('ID is required for updates')
  }),
  'DELETE_TASK': z.object({
    id: z.string().uuid()
  }),

  // Events
  'CREATE_EVENT': EventSchema.extend({
    title: z.string().min(1, 'Title is required'),
    tenant_id: z.string().uuid('Tenant ID is required for creation')
  }),
  'UPDATE_EVENT': EventSchema.partial().extend({
    id: z.string().uuid('ID is required for updates')
  }),
  'DELETE_EVENT': z.object({
    id: z.string().uuid()
  }),

  // Relational Assignments (Tasks)
  'ASSIGN_USER': AssignmentPayloadSchema,
  'UNASSIGN_USER': UnassignmentPayloadSchema,

  // Relational Assignments (Events)
  'ASSIGN_CREW': z.object({
    event_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role: z.string().optional(),
    tenant_id: z.string().uuid()
  }),
  'UNASSIGN_CREW': z.object({
    event_id: z.string().uuid(),
    user_id: z.string().uuid()
  }),
  'ASSIGN_EQUIPMENT': z.object({
    event_id: z.string().uuid(),
    inventory_id: z.string().uuid(),
    reserved_from: z.string(),
    reserved_to: z.string(),
    tenant_id: z.string().uuid()
  }),
  'UNASSIGN_EQUIPMENT': z.object({
    event_id: z.string().uuid(),
    inventory_id: z.string().uuid()
  }),
};
