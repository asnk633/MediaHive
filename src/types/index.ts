// src/types/index.ts
// Centralized type exports to ensure a single source of truth

export * from '@/features/tasks/types/task';
export * from '@/features/events/types/event';
export * from './user';
export * from '@/features/campaigns/types/campaign';
export * from './file';
export * from './notification';
export * from './deliverable';
export * from './mediaComment';

// Add any shared generic types below if needed
export type StatusOrderMapping = Record<string, number>;
