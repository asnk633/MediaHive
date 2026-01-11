import { TimestampLike } from '@/types/timestamp';

export interface User {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'team' | 'guest';
    photoURL?: string;

    // Affiliation (One must be set, strictly XOR in logic)
    institutionId?: string;
    departmentId?: string;

    isActive?: boolean; // Defaults to true if undefined

    /** @deprecated Use institutionId */
    defaultInstitution?: string;
    /** @deprecated Use departmentId */
    defaultDepartment?: string;

    createdAt?: string;
    officialName?: string;
    avatarUrl?: string;
    avatarUpdatedAt?: TimestampLike;
}

export type UserRole = User['role'];
