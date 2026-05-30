const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fcctcorycpvebupluzpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2NDU0MSwiZXhwIjoyMDg3ODQwNTQxfQ.zDaxBjE6yUAa44PeTTSrNDDcIdrgG_PFS35C1DBjSX4'; // Service role key to bypass RLS and test if database accepts it

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPatch() {
  const id = 'b5c39e25-a5f0-4cfc-a1b6-4fdf258bc76e'; // Anwar's balance row
  const tenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';
  
  const newBalances = {
    sick: { taken: 0, total: 5 },
    other: { taken: 0, total: 5 },
    casual: { taken: 0, total: 5 },
    unpaid: { taken: 0, total: 60 },
    planned: { taken: 0, total: 40 },
    emergency: { taken: 0, total: 5 }
  };

  console.log('Sending direct update with service role client...');
  const { data, error } = await supabase
    .from('user_leave_balances')
    .update({ balances: newBalances, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select();

  console.log('Result data:', JSON.stringify(data));
  console.log('Result error:', JSON.stringify(error));
}

testPatch();
