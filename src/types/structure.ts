export type StructureStatus = 'active' | 'archived';

export interface Institution {
    id: string;
    name: string;
    status: StructureStatus;
    created_at?: string;
    updated_at?: string;
    features?: Record<string, boolean>;
    userCount?: number;
}

export interface Department {
    id: string;
    name: string;
    status: StructureStatus;
    created_at?: string;
    updated_at?: string;
}
