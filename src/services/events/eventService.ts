import { supabase } from '@/lib/supabaseClient';
import { EventItem, EventItemSchema } from './eventContract';
import { tenantContext } from '@/lib/auth/tenantContext';

export function mapEvent(row: any): EventItem {
    const event = {
        id: row.id,
        title: row.title,
        startTime: row.start_at || row.start_time || row.startTime,
        endTime: row.end_at || row.end_time || row.endTime,
        type: row.type || 'general',
        institutionId: row.institution_id || row.institutionId,
        description: row.description,
        production_stage: row.production_stage || 'planning'
    };
    const result = EventItemSchema.safeParse(event);
    if (!result.success) {
        console.error("[EventMapping] Validation failed:", result.error.format());
        return event as EventItem;
    }
    return result.data;
}

export const eventService = {
    async getAll(params: { start?: string; end?: string } = {}): Promise<EventItem[]> {
        const { tenantId } = await tenantContext();

        let query = supabase
            .from('events')
            .select('*')
            .eq('tenant_id', tenantId);

        if (params.start) query = query.gte('start_at', params.start);
        if (params.end) query = query.lte('end_at', params.end);

        const { data, error } = await query;
        if (error) {
            console.error("[EventService] Error fetching events:", error);
            return [];
        }

        return ((data as any[]) || []).map(mapEvent);
    },

    async create(data: Partial<EventItem>): Promise<EventItem> {
        const { tenantId, userId } = await tenantContext();

        const { data: result, error } = await supabase
            .from('events')
            .insert([{
                ...data,
                tenant_id: tenantId,
                created_by: userId
            }])
            .select()
            .single();

        if (error) throw error;
        return mapEvent(result);
    }
};
