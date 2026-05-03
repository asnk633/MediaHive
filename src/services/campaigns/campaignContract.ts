/**
 * Campaign Service Contract
 * 
 * Canonical domain model for campaigns as seen by consumers.
 * All campaign data returned by @/services/campaigns must conform to this type.
 * Feature modules (features/campaigns) own the raw DB types; this is the shared view.
 */

export type CampaignPhase = 'planning' | 'production' | 'review' | 'publish' | 'completed';

export interface CampaignItem {
    id: string;
    name: string;
    description?: string;
    phase: CampaignPhase;
    startDate?: string;  // ISO string
    endDate?: string;    // ISO string
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
    institutionId?: string;
    members?: string[];
}

/**
 * Maps a raw API campaign object to the canonical CampaignItem contract.
 * Normalises both camelCase and snake_case field names from the API.
 */
export function mapCampaign(raw: any): CampaignItem {
    return {
        id: raw.id,
        name: raw.name || raw.title || '',
        description: raw.description,
        phase: raw.phase ?? raw.status ?? 'planning',
        startDate: raw.startDate ?? raw.start_date,
        endDate: raw.endDate ?? raw.end_date,
        ownerId: raw.ownerId ?? raw.owner_id,
        createdAt: raw.created_at ?? raw.createdAt,
        updatedAt: raw.updated_at ?? raw.updatedAt,
        institutionId: raw.institution_id ?? raw.institutionId,
        members: raw.members ?? [],
    };
}
