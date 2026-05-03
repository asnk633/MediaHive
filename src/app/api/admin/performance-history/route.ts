import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    service: 'admin-performance-history',
    message: 'Performance history processed via batch jobs.'
  });
}
