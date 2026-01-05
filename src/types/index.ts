// src/types/index.ts
// Centralized type exports to ensure a single source of truth

export * from './task';
export * from './event';
export * from './user';
export * from './campaign';
export * from './file';
export * from './notification';
export * from './deliverable';
export * from './mediaComment';

// Add any shared generic types below if needed
export type StatusOrderMapping = Record<string, number>;
