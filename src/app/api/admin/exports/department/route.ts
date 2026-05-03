import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    service: 'admin-exports-department',
    message: 'Department exports handled via client-side csv generation or server-side Supabase query.'
  });
}
