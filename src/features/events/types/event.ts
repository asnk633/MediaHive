import { TimestampLike } from '@/types/timestamp';

export interface EventCrewAssignment {
    id: string;
    event_id: string;
    user_id: string;
    role?: string;
    profile?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export interface EventEquipmentReservation {
    id: string;
    event_id: string;
    inventory_id: string;
    reserved_from: TimestampLike;
    reserved_to: TimestampLike;
    inventory?: {
        id: string;
        name: string;
        image_url?: string;
    };
}

export interface Event {
    id: string;
    title: string;
    description?: string;
    
    // Core timing (TIMESTAMPTZ)
    start_at: string; // ISO string
    end_at: string;   // ISO string
    is_all_day?: boolean;

    // Legacy fields - to be removed after migration
    date?: TimestampLike; 
    
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
        id: string | number;
        name: string;
        type: 'department' | 'institution';
    };
    organizer?: {
        uid: string;
        name: string;
        role: string;
    };
    institution_id?: string | number;
    department_id?: string | number;
    crew?: EventCrewAssignment[];
    equipment?: EventEquipmentReservation[];
}
