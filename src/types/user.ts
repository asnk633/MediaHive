import { TimestampLike } from '@/types/timestamp';

export interface User {
    uid: string;
    id: string; // Alias for uid
    email: string;
    name: string;
    official_name?: string; // Legacy alias for name
    fullName?: string; // Legacy alias for name
    role: 'admin' | 'manager' | 'team' | 'member';
    institutionRoles?: Record<string, string>;
    is_super_admin?: boolean;
    photoURL?: string;

    // Affiliation
    tenant_id?: string | number;
    institution_id?: string | number;
    allowed_institutions?: string[];
    department_id?: string | number;

    isActive?: boolean;

    created_at?: string;
    avatar_url?: string;
    avatar_updated_at?: TimestampLike;
    avatar_drive_id?: string;

    // UI Fallbacks/Helpers
    default_institution?: string;
    default_department?: string;
}

export type UserRole = User['role'];
