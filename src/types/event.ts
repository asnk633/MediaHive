
import { Timestamp } from 'firebase/firestore';

export interface Event {
    id: string;
    title: string;
    description?: string;
    date: Timestamp; // This is the START date
    location?: string;
    type: 'meeting' | 'workshop' | 'deadline' | 'other';
    department?: string;
    createdBy: {
        uid: string;
        name: string;
        role?: string;
    };
    createdAt: Timestamp;
}
