// scripts/sendBroadcastExample.ts
// Script to simulate or trigger an administrative broadcast push notification using Expo

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sendExpoPush } from '../src/lib/sendExpoPush';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('\n--- Starting Expo Push Broadcast Simulation ---\n');

  // 1. Query user profiles with a registered Expo push token
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, expo_push_token')
    .not('expo_push_token', 'is', null);

  if (error) {
    console.warn('⚠️ Failed to fetch user profiles (likely due to missing SERVICE_ROLE_KEY or RLS constraints):', error.message);
    
    console.log('\nRunning stub test using a mock token instead...');
    const mockToken = 'ExponentPushToken[mock_developer_device_token]';
    await sendExpoPush(
      mockToken,
      'Test Alert: Media Team',
      'This is a simulated guest task assignment push alert.'
    );
    process.exit(0);
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No profiles found with a registered expo_push_token.');
    console.log('Register a token by going to the profile page on the web app or saving a token in the database.');
    
    console.log('\nRunning stub test using a mock token instead...');
    const mockToken = 'ExponentPushToken[mock_developer_device_token]';
    await sendExpoPush(
      mockToken,
      'Test Alert: Media Team',
      'This is a simulated guest task assignment push alert.'
    );
    process.exit(0);
  }

  console.log(`Found ${profiles.length} profile(s) with registered Expo push tokens:`);
  profiles.forEach(p => {
    console.log(`- ${p.full_name || 'Unknown User'} (${p.role || 'member'}): ${p.expo_push_token}`);
  });

  const title = 'System Update: Broadcast Notification';
  const body = 'This is a simulated broadcast sent to all users with active Expo push tokens.';

  console.log('\nInitiating push notification dispatch...');
  for (const profile of profiles) {
    if (profile.expo_push_token) {
      console.log(`Sending push to ${profile.full_name}...`);
      const result = await sendExpoPush(profile.expo_push_token, title, body);
      console.log(`Result for ${profile.full_name}:`, JSON.stringify(result, null, 2));
    }
  }

  console.log('\n--- Simulation complete ---\n');
}

run().catch(error => {
  console.error('❌ Fatal error in broadcast script:', error);
  process.exit(1);
});
