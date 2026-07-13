import { NextResponse, NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/verifyUser';

export async function GET(req: NextRequest) {
  const { authorized, response } = await verifyAdmin(req);
  if (!authorized) return response!;

  return NextResponse.json({
    status: 'ready',
    service: 'admin-exports-user',
    message: 'User exports handled via client-side csv generation or server-side Supabase query.'
  });
}
