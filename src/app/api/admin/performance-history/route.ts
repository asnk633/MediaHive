import { NextResponse, NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/verifyUser';

export async function GET(req: NextRequest) {
  const { authorized, response } = await verifyAdmin(req);
  if (!authorized) return response!;

  return NextResponse.json({
    status: 'ready',
    service: 'admin-performance-history',
    message: 'Performance history processed via batch jobs.'
  });
}
