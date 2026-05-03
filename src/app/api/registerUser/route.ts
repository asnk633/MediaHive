import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/registerUser
 * @deprecated This endpoint is obsolete with Supabase migration.
 * Profile hydration is handled automatically via verifyUser fallback or DB triggers.
 */
export async function POST(request: NextRequest) {
  console.warn('[DEPRECATED] POST /api/registerUser called. This endpoint is obsolete.');

  return NextResponse.json({
    message: 'Registration via this endpoint is deprecated. Profile hydration is handled automatically.',
    success: true,
    obsolete: true
  }, { status: 200 });
}
