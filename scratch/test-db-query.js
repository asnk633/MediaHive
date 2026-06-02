const { createClient } = require('@supabase/supabase-js');

const url = 'https://fcctcorycpvebupluzpe.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2NDU0MSwiZXhwIjoyMDg3ODQwNTQxfQ.zDaxBjE6yUAa44PeTTSrNDDcIdrgG_PFS35C1DBjSX4';
const roomId = '03da507c-ea11-4806-8c24-c38a5ec625e3';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing query on chat_participants with profiles join...');
  const { data, error } = await supabase
    .from('chat_participants')
    .select('user_id, role, profiles!chat_participants_user_id_fkey(id, full_name, role, email)')
    .eq('room_id', roomId);

  if (error) {
    console.error('Error returned from query:', error);
  } else {
    console.log('Success! Data returned:', JSON.stringify(data, null, 2));
  }
}

test();
