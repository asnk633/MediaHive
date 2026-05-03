import { TimestampLike } from '@/types/timestamp';

export interface User {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'team' | 'guest';
    is_super_admin?: boolean;
    photoURL?: string;

    // Affiliation
    institution_id?: string;
    department_id?: string;

    isActive?: boolean;

    created_at?: string;
    official_name?: string;
    avatar_url?: string;
    avatar_updated_at?: TimestampLike;
    avatar_drive_id?: string;

    // UI Fallbacks/Helpers
    default_institution?: string;
    default_department?: string;
}

export type UserRole = User['role'];
