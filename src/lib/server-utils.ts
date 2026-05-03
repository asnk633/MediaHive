// @ts-nocheck
import 'server-only';
import { Permission, hasPermission, Role } from '@/lib/permissions';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// AuthenticatedUser type
// ---------------------------------------------------------------------------
export interface AuthenticatedUser {
    uid: string;
    email?: string;
    email_verified?: boolean;
    role?: Role | string;
    institution_id?: string;
    tenantId?: number | string;
    name?: string;
    /** Raw Supabase profile data */
    _dbData?: Record<string, any>;
    [key: string]: any;
}

import { createClient } from '@supabase/supabase-js';

/**
 * verifyUser - Primary authentication check for all API routes.
 * Authoritative: Uses Bearer token + DB profile lookup.
 * @param req Request object
 * @param options { strict: boolean } if false, returns basic auth info if profile is missing
 */
export async function verifyUser(req: Request, options = { strict: true }) {
    // 1. Extract Bearer token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
        console.warn('[verifyUser] No Authorization header');
        return null;
    }

    // 2. Supabase client WITH auth context
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            global: {
                headers: {
                    Authorization: authHeader,
                },
            },
        }
    );

    // 3. Authenticate user
    const { data: authData, error: authError } =
        await supabase.auth.getUser();

    if (authError || !authData.user) {
        console.warn('[verifyUser] auth.getUser failed', authError);
        return null;
    }

    const userId = authData.user.id;

    // 4. Fetch PROFILE (Authoritative lookup)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, institution_id')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        if (!options.strict) {
            // Return basic identity if NOT strict (used for profile auto-creation)
            return {
                uid: userId,
                email: authData.user.email,
                role: 'guest', // Default role for new users
                isInitial: true
            };
        }
        console.error('[verifyUser] profile lookup failed', profileError);
        return null;
    }

    // 5. Hard invariant
    if (!profile.institution_id) {
        throw new Error('User profile missing institution_id');
    }

    return {
        uid: userId,
        email: authData.user.email,
        role: profile.role,
        institution_id: profile.institution_id,
    };
}

/**
 * getSupabaseFromRequest - Returns a Supabase client authenticated via the request header.
 */
export function getSupabaseFromRequest(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            global: {
                headers: {
                    Authorization: authHeader,
                },
            },
        }
    );
}

/**
 * getSupabaseAdmin - Returns a Supabase client with service role privileges.
 * Use ONLY for background tasks and system-level operations (bypasses RLS).
 */
export function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}


/**
 * authorizeByPermission - Checks if the authenticated user has a specific permission.
 */
export async function authorizeByPermission(request: Request, permission: Permission) {
    const user = await verifyUser(request);
    if (!user) return { authorized: false, user: null };
    const authorized = hasPermission(user.role as Role, permission);
    return { authorized, user: authorized ? user : user };
}

export const HEADQUARTERS_NAME = 'Thaiba Garden HQ';
