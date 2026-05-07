import { TimestampLike } from '@/types/timestamp';

export type CampaignPhase = 'planning' | 'production' | 'review' | 'publish' | 'completed';
export type CampaignRole = 'admin' | 'manager' | 'team' | 'member';

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    startDate: string; // ISO String
    endDate: string;   // ISO String
    phase: CampaignPhase;

    driveFolderId?: string; // Google Drive folder ID for this campaign

    ownerId: string; // UID of the creator/owner
    created_by: {
        uid: string;
        role: CampaignRole;
        name: string;
    };

    members: string[]; // Array of UIDs who can access/edit (Admin/Team usually have implicit access, but this helps filtering)

    created_at: TimestampLike;
    updated_at: TimestampLike;
}
