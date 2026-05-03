import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { EventSchema } from '@/domain/schemas';
import { MonitoringService } from './monitoringService';
import { CanonicalDataService } from './canonicalDataService';
import { mapTask, TaskService } from '@/features/tasks/services/taskService';

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
        MonitoringService.warn('[ProductionService] No eventId provided');
        return null;
      }
      const sanitizedId = eventId.replace(/\/$/, '');
      const { tenantId } = await tenantContext();

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
        MonitoringService.error('[ProductionService] Error fetching event', eventError, { sanitizedId });
        return null;
      }

      if (!event) return null;

      // DTO Validation for Event
      const eventParsed = EventSchema.safeParse(event);
      if (!eventParsed.success) {
        MonitoringService.warn("[ProductionService] DTO validation failed for event", { error: eventParsed.error, eventId: sanitizedId });
      }

      // 2. Fetch associated Tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
            *,
            task_assignments(
                user_id,
                role,
                profiles(id, full_name, avatar_url)
            )
        `)
        .eq('tenant_id', tenantId)
        .eq('event_id', sanitizedId)
        .eq('deleted', false)
        .order('due_date', { ascending: true });

      if (tasksError) {
        MonitoringService.error('[ProductionService] Error fetching tasks', tasksError, { eventId: sanitizedId });
      }

      // Map and validate tasks
      const validatedTasks = ((tasks as any[]) || []).map(mapTask);

      return {
        event,
        crew: event.crew || [],
        equipment: event.equipment || [],
        tasks: validatedTasks
      };
    } catch (error: any) {
      MonitoringService.error('[ProductionService] Unexpected error', error, { eventId });
      return null;
    }
  }

  /**
   * Updates production (event) details
   */
  static async updateProduction(
    eventId: string, 
    updates: any, 
    baseUpdatedAt?: string, 
    baseVersion?: number
  ): Promise<{ success: boolean; error?: any; data?: any }> {
    try {
      const sanitizedId = eventId.replace(/\/$/, '');
      const success = await CanonicalDataService.patchFields(
        'events', 
        sanitizedId, 
        updates, 
        'production', 
        baseUpdatedAt, 
        baseVersion
      );
      return { success };
    } catch (error: any) {
      MonitoringService.error('[ProductionService] Update error', error, { eventId });
      return { success: false, error };
    }
  }

  /**
   * Deletes a production and all associated tasks
   */
  static async deleteProduction(eventId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const sanitizedId = eventId.replace(/\/$/, '');
      const { tenantId } = await tenantContext();

      // 1. Fetch all associated tasks to soft-delete them
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id')
        .eq('event_id', sanitizedId)
        .eq('tenant_id', tenantId)
        .eq('deleted', false);

      if (fetchError) throw fetchError;

      // 2. Perform bulk soft-delete of tasks
      if (tasks && tasks.length > 0) {
        const taskUpdates = tasks.map(t => ({
          id: t.id,
          fields: { deleted: true, deleted_at: new Date().toISOString() }
        }));
        await CanonicalDataService.bulkUpdateFields('tasks', taskUpdates, 'task');
      }

      // 3. Soft-delete the event itself
      const success = await CanonicalDataService.patchFields(
        'events', 
        sanitizedId, 
        { deleted: true, deleted_at: new Date().toISOString() }, 
        'production'
      );

      return { success };
    } catch (error: any) {
      MonitoringService.error('[ProductionService] Delete error', error, { eventId });
      return { success: false, error };
    }
  }

  /**
   * Updates a single task - REDIRECTED to TaskService
   */
  static async updateTask(taskId: string, updates: any, baseUpdatedAt?: string, baseVersion?: number): Promise<any> {
    return TaskService.updateTask(taskId, updates, baseUpdatedAt, baseVersion);
  }
}
