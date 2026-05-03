import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { EventSchema, TaskSchema } from '@/domain/schemas';

export interface ProductionFile {
  event: any;
  crew: any[];
  equipment: any[];
  tasks: any[];
}

export class ProductionService {
  /**
   * Fetches all data for a specific production (event)
   */
  static async getProductionFile(eventId: string): Promise<ProductionFile | null> {
    try {
      if (!eventId) {
        console.error('[ProductionService] No eventId provided');
        return null;
      }
      const sanitizedId = eventId.replace(/\/$/, ''); // Remove trailing slash
      const { tenantId } = await tenantContext();

      console.log(`[ProductionService] Fetching production: ${sanitizedId} for tenant: ${tenantId}`);

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          crew:event_crew(
            *,
            profile:profiles(id, full_name, avatar_url, role)
          ),
          equipment:event_equipment(
            *,
            inventory:inventory(id, name, category, model, image_url)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('id', sanitizedId)
        .single();

      if (eventError) {
        console.error('[ProductionService] Error fetching event:', {
          message: eventError.message,
          details: eventError.details,
          hint: eventError.hint,
          code: eventError.code,
          sanitizedId
        });
        return null;
      }

      if (!event) return null;

      // DTO Validation for Event
      const eventParsed = EventSchema.safeParse(event);
      if (!eventParsed.success) {
        console.warn("[ProductionService] DTO validation failed for event:", eventParsed.error);
      }

      // 2. Fetch associated Tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('event_id', eventId)
        .eq('deleted', false)
        .order('due_date', { ascending: true });

      if (tasksError) {
        console.error('[ProductionService] Error fetching tasks:', tasksError);
      }

      // DTO Validation for Tasks
      const validatedTasks = ((tasks as any[]) || []).map((task: any) => {
        const parsed = TaskSchema.safeParse(task);
        if (!parsed.success) {
          console.warn("[ProductionService] DTO validation failed for task:", parsed.error);
        }
        return task;
      });

      return {
        event,
        crew: event.crew || [],
        equipment: event.equipment || [],
        tasks: validatedTasks
      };
    } catch (error) {
      console.error('[ProductionService] Unexpected error:', error);
      return null;
    }
  }

  /**
   * Updates production (event) details
   */
  static async updateProduction(eventId: string, updates: any): Promise<{ data: any; error: any }> {
    try {
      const { tenantId } = await tenantContext();
      const sanitizedId = eventId.replace(/\/$/, '');

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('tenant_id', tenantId)
        .eq('id', sanitizedId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('[ProductionService] Update error:', error);
      return { data: null, error };
    }
  }

  /**
   * Updates a single task
   */
  static async updateTask(taskId: string, updates: any): Promise<{ data: any; error: any }> {
    try {
      const { tenantId } = await tenantContext();

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('tenant_id', tenantId)
        .eq('id', taskId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('[ProductionService] Task update error:', error);
      return { data: null, error };
    }
  }
}
