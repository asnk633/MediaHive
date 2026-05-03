import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { TABLES } from '@/lib/dbTables';

export async function GET() {
  const start = Date.now();
  let dbStatus = false;
  let authStatus = false;
  let details: any = {};

  try {
    // 1. Check DB Connection
    const { error: dbError } = await supabase.from(TABLES.USERS).select('id').limit(1);
    dbStatus = !dbError;
    if (dbError) details.dbError = dbError.message;

    // 2. Check Auth Service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    authStatus = !authError;
    if (authError) details.authError = authError.message;

    const status = dbStatus && authStatus ? 'ok' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      latency: `${Date.now() - start}ms`,
      checks: {
        database: dbStatus,
        auth: authStatus,
      },
      details: Object.keys(details).length > 0 ? details : undefined
    }, {
      status: status === 'ok' ? 200 : 503
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}
