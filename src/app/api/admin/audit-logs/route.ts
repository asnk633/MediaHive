import { NextResponse, NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/verifyUser';

export async function GET(req: NextRequest) {
  const { authorized, response } = await verifyAdmin(req);
  if (!authorized) return response!;

  return NextResponse.json({
    status: 'ready',
    service: 'admin-audit-logs',
    message: 'Audit logs available via Supabase audit_log table.'
  });
}
