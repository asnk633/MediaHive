import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/server-utils';

/**
 * Checks for idempotency key in headers and enforces uniqueness.
 * Uses ONLY Supabase for tracking.
 */
export async function verifyIdempotency(req: NextRequest): Promise<NextResponse | null> {
    const key = req.headers.get('Idempotency-Key');
    if (!key) return null;

    const supabase = getSupabaseAdmin();

    try {
        // 1. Check if key exists in Supabase
        const { data, error } = await supabase
            .from('idempotency_keys')
            .select('*')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            console.warn('[IDEMPOTENCY] Supabase check failed, failing open:', error.message);
            return null;
        }

        if (data) {
            const now = new Date().getTime();
            const createdAt = new Date(data.created_at).getTime();

            // 24 hour TTL
            if (now - createdAt < 24 * 60 * 60 * 1000) {
                return NextResponse.json(
                    { error: 'Idempotency key already used', originalRequest: data.created_at },
                    { status: 409 }
                );
            }
        }

        // 2. Reserve key in Supabase
        await supabase.from('idempotency_keys').upsert({
            key,
            status: 'pending',
            path: req.nextUrl.pathname,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            created_at: new Date().toISOString()
        }, { onConflict: 'key' });

        return null;
    } catch (error: any) {
        console.error('[IDEMPOTENCY_FATAL]', error);
        return null; // Fail open
    }
}
