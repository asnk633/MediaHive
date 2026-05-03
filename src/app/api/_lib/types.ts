// src/app/api/_lib/types.ts
// Shared types for API modules

import { UserRole } from '@/types';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  institution_id: number;
  tenantId: number; // Add tenantId for multi-tenant support
}

export type { UserRole };
