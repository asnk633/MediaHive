import { createClient } from '@supabase/supabase-js';

// No fallbacks - throw error if not defined
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set for E2E cleanups');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Each execution has a unique E2E_RUN_ID set in global-setup or generated on load
const runId = process.env.E2E_RUN_ID || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

export function getTestPrefix(area: string): string {
  return `E2E-${area}-${runId}`;
}

export async function cleanupByPrefix(table: string, column: string, prefix: string) {
  console.log(`🧹 Initiating cleanup for table '${table}' where '${column}' starts with '${prefix}'...`);

  try {
    // Foreign key dependencies handling
    if (table === 'chat_rooms') {
      // 1. Find the room IDs first
      const { data: rooms, error: roomsErr } = await supabaseAdmin
        .from('chat_rooms')
        .select('id')
        .like(column, `${prefix}%`);
      
      if (roomsErr) throw roomsErr;
      
      if (rooms && rooms.length > 0) {
        const roomIds = rooms.map(r => r.id);
        
        // 2. Delete messages in those rooms
        const { error: msgErr, count: msgCount } = await supabaseAdmin
          .from('chat_messages')
          .delete({ count: 'exact' })
          .in('room_id', roomIds);
        if (msgErr) throw msgErr;
        console.log(`   Deleted ${msgCount ?? 0} messages for rooms with prefix ${prefix}`);

        // 3. Delete participants in those rooms
        const { error: partErr, count: partCount } = await supabaseAdmin
          .from('chat_participants')
          .delete({ count: 'exact' })
          .in('room_id', roomIds);
        if (partErr) throw partErr;
        console.log(`   Deleted ${partCount ?? 0} participants for rooms with prefix ${prefix}`);

        // 4. Delete the rooms themselves
        const { error: roomDelErr, count: roomCount } = await supabaseAdmin
          .from('chat_rooms')
          .delete({ count: 'exact' })
          .in('id', roomIds);
        if (roomDelErr) throw roomDelErr;
        console.log(`   Deleted ${roomCount ?? 0} chat rooms with prefix ${prefix}`);
      }
      return;
    }

    if (table === 'tasks') {
      // 1. Find the task IDs first
      const { data: tasks, error: tasksErr } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .like(column, `${prefix}%`);

      if (tasksErr) throw tasksErr;

      if (tasks && tasks.length > 0) {
        const taskIds = tasks.map(t => t.id);

        // 2. Delete assignments first (child table)
        const { error: assignErr, count: assignCount } = await supabaseAdmin
          .from('task_assignments')
          .delete({ count: 'exact' })
          .in('task_id', taskIds);
        if (assignErr) throw assignErr;
        console.log(`   Deleted ${assignCount ?? 0} task assignments for tasks with prefix ${prefix}`);

        // 3. Delete tasks
        const { error: taskDelErr, count: taskCount } = await supabaseAdmin
          .from('tasks')
          .delete({ count: 'exact' })
          .in('id', taskIds);
        if (taskDelErr) throw taskDelErr;
        console.log(`   Deleted ${taskCount ?? 0} tasks with prefix ${prefix}`);
      }
      return;
    }

    if (table === 'events') {
      // 1. Find the event IDs
      const { data: events, error: eventsErr } = await supabaseAdmin
        .from('events')
        .select('id')
        .like(column, `${prefix}%`);
      
      if (eventsErr) throw eventsErr;

      if (events && events.length > 0) {
        const eventIds = events.map(e => e.id);

        // Delete crew assignments
        const { error: crewErr, count: crewCount } = await supabaseAdmin
          .from('event_crew')
          .delete({ count: 'exact' })
          .in('event_id', eventIds);
        if (crewErr) throw crewErr;
        console.log(`   Deleted ${crewCount ?? 0} crew assignments for events with prefix ${prefix}`);

        // Delete equipment assignments
        const { error: equipErr, count: equipCount } = await supabaseAdmin
          .from('event_equipment')
          .delete({ count: 'exact' })
          .in('event_id', eventIds);
        if (equipErr) throw equipErr;
        console.log(`   Deleted ${equipCount ?? 0} equipment assignments for events with prefix ${prefix}`);

        // Delete events
        const { error: eventDelErr, count: eventCount } = await supabaseAdmin
          .from('events')
          .delete({ count: 'exact' })
          .in('id', eventIds);
        if (eventDelErr) throw eventDelErr;
        console.log(`   Deleted ${eventCount ?? 0} events with prefix ${prefix}`);
      }
      return;
    }

    if (table === 'inventory_items') {
      // 1. Find inventory IDs
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('inventory_items')
        .select('id')
        .like(column, `${prefix}%`);
      
      if (itemsErr) throw itemsErr;

      if (items && items.length > 0) {
        const itemIds = items.map(i => i.id);

        // Helper to safely delete child records
        const safeDeleteChild = async (childTable: string, columnId: string) => {
            try {
                const { error, count } = await supabaseAdmin
                  .from(childTable)
                  .delete({ count: 'exact' })
                  .in(columnId, itemIds);
                if (error) console.error(`   Failed to delete ${childTable}: ${error.message}`);
                else console.log(`   Deleted ${count ?? 0} ${childTable} for items with prefix ${prefix}`);
            } catch (e: any) {
                console.error(`   Exception deleting ${childTable}: ${e.message}`);
            }
        };

        // Delete child tables safely
        await safeDeleteChild('inventory_requests', 'inventory_item_id'); // Try the most likely column name
        await safeDeleteChild('inventory_requests', 'item_id'); // Fallback to what was there
        await safeDeleteChild('inventory_issues', 'item_id');
        await safeDeleteChild('inventory_issues', 'inventory_item_id');
        await safeDeleteChild('equipment_bookings', 'item_id');
        await safeDeleteChild('equipment_bookings', 'inventory_item_id');

        // Delete the items
        const { error: itemDelErr, count: itemCount } = await supabaseAdmin
          .from('inventory_items')
          .delete({ count: 'exact' })
          .in('id', itemIds);
        if (itemDelErr) throw itemDelErr;
        console.log(`   Deleted ${itemCount ?? 0} inventory items with prefix ${prefix}`);
      }
      return;
    }

    // Default simple delete for tables with no complex foreign keys
    const { error, count } = await supabaseAdmin
      .from(table)
      .delete({ count: 'exact' })
      .like(column, `${prefix}%`);

    if (error) throw error;
    console.log(`   Deleted ${count ?? 0} rows from '${table}'`);
  } catch (err: any) {
    console.error(`❌ Cleanup failed for table '${table}':`, err.message || err);
    throw err;
  }
}
