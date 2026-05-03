
import { TimestampLike } from '@/types/timestamp';

export interface Event {
    id: string;
    title: string;
    description?: string;
    date: TimestampLike; // This is the START date
    start_at?: TimestampLike; // Replaces date in Supabase
    start_time?: TimestampLike;
    end_at?: TimestampLike;
    end_time?: TimestampLike;
    location?: string;
    type: 'meeting' | 'workshop' | 'deadline' | 'other';
    department?: string;
    created_by: {
        uid: string;
        name: string;
        role?: string;
    };
    created_at: TimestampLike;
    media_coverage?: string[];
    status?: 'pending' | 'approved' | 'rejected';
    is_demo_data?: boolean;
    is_system_event?: boolean;
    is_media_off_day?: boolean;
    on_behalf_of?: {
        id: string;
        name: string;
        type: 'department' | 'institution';
    };
    organizer?: {
        uid: string;
        name: string;
        role: string;
    };
    institution_id?: string;
    department_id?: string;
}
