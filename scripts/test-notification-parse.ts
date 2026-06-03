import { createClient } from '@supabase/supabase-js';
import { NotificationSchema } from '../src/domain/schemas/notification';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch:', error);
    return;
  }

  console.log('Fetched', data?.length, 'notifications');

  for (const item of data || []) {
    const parsed = NotificationSchema.safeParse(item);
    if (!parsed.success) {
      console.log('Failed item ID:', item.id);
      console.log('Raw data:', item);
      console.log('Zod errors:', parsed.error.issues);
    } else {
      console.log('Successfully parsed item ID:', item.id);
    }
  }
}

main();
