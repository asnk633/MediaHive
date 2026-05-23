import { TimestampLike } from '@/types/timestamp';

export type LeaveType = 'casual' | 'sick' | 'planned' | 'unpaid' | 'emergency' | 'other';

export interface LeaveBalance {
    id: string | number;
    uid: string;
    year: number;
    balances: {
        casual: { taken: number; total: number };
        sick: { taken: number; total: number };
        planned: { taken: number; total: number };
        unpaid: { taken: number; total: number };
        emergency: { taken: number; total: number };
        other: { taken: number; total: number };
    };
    updated_at: TimestampLike;
}

// Default allowances per leave type
export const DEFAULT_LEAVE_ALLOWANCES: Record<LeaveType, number> = {
    planned: 40,
    unpaid: 60,
    sick: 5,
    casual: 5,
    emergency: 9999,
    other: 9999
};
