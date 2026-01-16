
import { TimestampLike } from '@/types/timestamp';

export interface Event {
    id: string;
    title: string;
    description?: string;
    date: TimestampLike; // This is the START date
    startTime?: TimestampLike;
    endTime?: TimestampLike;
    location?: string;
    type: 'meeting' | 'workshop' | 'deadline' | 'other';
    department?: string;
    createdBy: {
        uid: string;
        name: string;
        role?: string;
    };
    createdAt: TimestampLike;
    mediaCoverage?: string[];
    status?: 'pending' | 'approved' | 'rejected';
    isDemoData?: boolean;
    isSystemEvent?: boolean;
    isMediaOffDay?: boolean;
    onBehalfOf?: {
        id: string;
        name: string;
        type: 'department' | 'institution';
    };
    organizer?: {
        uid: string;
        name: string;
        role: string;
    };
    institutionId?: string;
    departmentId?: string;
}
