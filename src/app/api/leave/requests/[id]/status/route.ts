import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TABLES } from '@/lib/dbTables';
import { LeaveBalanceService } from '@/services/leaveBalanceService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  try {
    const { status } = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get the request details
    const { data: leaveRequest, error: fetchError } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !leaveRequest) throw new Error('Request not found');

    // 2. Update status
    const { error: updateError } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .update({ 
        status, 
        processed_by: user.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. If approved, deduct from balance
    if (status === 'approved') {
        // We'll need to call the service. Since this is an edge function/route, 
        // we might need to handle it carefully or let the client/background task handle it.
        // Actually, for consistency, we do it here.
        // Wait, LeaveBalanceService uses supabase client which might not be configured for server-side here.
        // I'll do it manually.
        
        // Fetch current balance
        const { data: balance, error: balError } = await supabase
            .from(TABLES.LEAVE_BALANCES)
            .select('*')
            .eq('user_id', leaveRequest.requested_by_id)
            .eq('year', new Date(leaveRequest.start_date).getFullYear())
            .single();

        if (balance) {
            const type = leaveRequest.type;
            const days = leaveRequest.total_days;
            const newBalances = { ...balance.balances };
            if (newBalances[type]) {
                newBalances[type].taken = (newBalances[type].taken || 0) + days;
                
                await supabase
                    .from(TABLES.LEAVE_BALANCES)
                    .update({ balances: newBalances, updated_at: new Date().toISOString() })
                    .eq('id', balance.id);
            }
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API/LeaveStatus] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
