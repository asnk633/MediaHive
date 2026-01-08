export type StructureStatus = 'active' | 'archived';

export interface Institution {
    id: string;
    name: string;
    status: StructureStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface Department {
    id: string;
    name: string;
    status: StructureStatus;
    createdAt?: string;
    updatedAt?: string;
}
