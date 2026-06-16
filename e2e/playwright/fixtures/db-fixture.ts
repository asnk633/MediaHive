import { test as baseTest } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only initialize if we have the keys, so it doesn't crash in environments without Supabase (if any)
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export type TrackedEntity = {
  table: string;
  id: string;
};

type DbFixtures = {
  dbTracker: {
    track: (table: string, id: string) => void;
  };
};

export const test = baseTest.extend<DbFixtures>({
  dbTracker: [async ({ page }, use) => {
    const tracked: TrackedEntity[] = [];

    const tracker = {
      track: (table: string, id: string) => {
        tracked.push({ table, id });
      }
    };

    // Auto-track creations by sniffing successful POST requests
    page.on('response', async (response) => {
      const request = response.request();
      if (request.method() === 'POST' && response.ok()) {
        const url = response.url();
        let table = '';
        if (url.includes('tasks')) table = 'tasks';
        else if (url.includes('events')) table = 'events';
        else if (url.includes('inventory')) table = 'inventory_items';
        else if (url.includes('chat')) table = 'chat_rooms';
        else if (url.includes('notifications')) table = 'notifications';

        if (table) {
          try {
            const body = await response.json();
            // Handle different API response structures
            const items = Array.isArray(body) ? body : (body?.data && Array.isArray(body.data) ? body.data : [body?.data || body]);
            for (const item of items) {
              if (item && item.id) {
                tracker.track(table, item.id);
              }
            }
          } catch (e) {
            // Ignore JSON parse errors (e.g. if the response is empty or already consumed)
          }
        }
      }
    });

    // Provide the tracker to the test
    await use(tracker);

    // Teardown: Order-aware deletion (children first)
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase admin client not initialized. Cannot perform E2E cleanup.');
      return;
    }

    const deletionOrder = ['notifications', 'tasks', 'events', 'inventory_items', 'chat_rooms'];
    
    for (const table of deletionOrder) {
      const ids = tracked.filter(t => t.table === table).map(t => t.id);
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length > 0) {
        console.log(`[dbTracker] Cleaning up ${uniqueIds.length} records from ${table}`);
        await supabaseAdmin.from(table).delete().in('id', uniqueIds);
      }
    }
    
    // Fallback guarantee: cleanup anything starting with E2E- (just in case auto-tracking missed)
    await supabaseAdmin.from('tasks').delete().like('title', 'E2E-%');
    
  }, { auto: true }], // auto: true means it runs for every test automatically
});

export { expect } from '@playwright/test';
