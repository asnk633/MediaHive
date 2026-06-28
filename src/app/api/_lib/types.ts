// src/app/api/_lib/types.ts
// Shared types for API modules

import { UserRole } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  institution_id: string;
  tenant_id: string;
  tenantId?: string;
}

export type { UserRole };
