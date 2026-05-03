import { TimestampLike } from '@/types/timestamp';

export type LeaveType = 'casual' | 'sick' | 'planned' | 'emergency' | 'other';

export interface LeaveBalance {
    uid: string;
    year: number;
    balances: {
        casual: { taken: number; total: number };
        sick: { taken: number; total: number };
        planned: { taken: number; total: number };
        emergency: { taken: number; total: number };
        other: { taken: number; total: number };
    };
    updated_at: TimestampLike;
}

// Default allowances per leave type
export const DEFAULT_LEAVE_ALLOWANCES: Record<LeaveType, number> = {
    casual: 12,
    sick: 10,
    planned: 15,
    emergency: 5,
    other: 3
};
