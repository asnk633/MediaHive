import { TimestampLike } from '@/types/timestamp';

export interface User {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'team' | 'guest';
    photoURL?: string;
    defaultDepartment?: string;
    defaultInstitution?: string;
    createdAt?: string;
    officialName?: string;
    avatarUrl?: string;
    avatarUpdatedAt?: TimestampLike;
}

export type UserRole = User['role'];
