import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const tables = [
  'institutions',
  'profiles',
  'tasks',
  'events',
  'notifications',
  'units',
  'campaigns',
  'system_events',
  'inventory',
  'inventory_issues',
  'device_requests',
  'files',
  'departments',
  'audit_log',
  'event_crew',
  'event_equipment',
  'drive_queue',
  'tenants',
  'inventory_requests',
  'equipment_bookings',
  'user_institutions',
  'invites',
  'task_assignments',
  'leave_requests',
  'user_leave_balances'
];

async function backup() {
  const backupDir = path.join(process.cwd(), 'backups', `backup-${Date.now()}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting backup to ${backupDir}...`);

  // 1. Backup Auth Users (Admin API)
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    fs.writeFileSync(path.join(backupDir, 'auth_users.json'), JSON.stringify(users, null, 2));
    console.log(`- Backed up ${users.length} auth users`);
  } catch (err) {
    console.error('Error backing up auth users:', err);
  }

  // 2. Backup Public Tables
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(data, null, 2));
      console.log(`- Backed up table: ${table} (${data.length} rows)`);
    } catch (err) {
      console.error(`Error backing up table ${table}:`, err);
    }
  }

  console.log('Backup complete!');
}

backup().catch(console.error);
