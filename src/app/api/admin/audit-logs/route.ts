import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    service: 'admin-audit-logs',
    message: 'Audit logs available via Supabase audit_log table.'
  });
}
