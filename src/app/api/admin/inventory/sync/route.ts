import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    status: 'ready',
    service: 'admin-inventory-sync',
    message: 'Manual inventory sync triggered.'
  });
}
