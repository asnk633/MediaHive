import { Permission, hasPermission, Role } from '@/lib/permissions';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import { TABLES } from './dbTables';
import { selfHealUser } from './selfHealUser';
import { NextResponse } from 'next/server';

export interface AuthenticatedUser {
    uid: string;
    email?: string;
    email_verified?: boolean;
    role?: Role | string;
    institution_id?: string | null;
    tenant_id?: string | null;
    tenantId?: string | null;
    name?: string;
    /** Raw Supabase profile data */
    _dbData?: Record<string, any>;
    [key: string]: any;
}

/**
 * Deprecated: Use getSupabaseServerClient from ./supabaseServerClient
 * Kept for backward compatibility during transition.
 */
export async function createServerSupabaseClient() {
    return getSupabaseServerClient();
}

/**
 * verifyUser - Primary authentication check for all API routes.
 */
export async function verifyUser(req: Request, options = { strict: true }): Promise<AuthenticatedUser | null> {
    const supabaseServer = await getSupabaseServerClient();

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    console.log(`[verifyUser] 🕵️ Checking auth for ${new URL(req.url).pathname}`);

    // 1. Try cookie-based session via getUser()
    const { data: { user: cookieUser }, error: cookieError } = await supabaseServer.auth.getUser();

    // Pulse check session for JWT claims
    const { data: { session } } = await supabaseServer.auth.getSession();
    if (session) {
        console.log(`[verifyUser] 🎫 JWT app_metadata:`, session.user.app_metadata);
    }

    let userId: string | null = null;
    let email: string | undefined = undefined;

    if (cookieUser) {
        userId = cookieUser.id;
        email = cookieUser.email;
    }

    // 2. Fallback: Bearer token
    if (!userId && authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user: tokenUser }, error: tokenError } = await supabaseServer.auth.getUser(token);
        if (tokenUser) {
            userId = tokenUser.id;
            email = tokenUser.email;
        }
    }

    if (!userId) return null;

    // 3. Fetch PROFILE
    const supabaseAdmin = getSupabaseAdmin();
    let { data: profile, error: profileError } = await supabaseAdmin
        .schema('public')
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

    // 🧠 SELF-HEALING: If profile is missing, try to create it
    if (profileError?.code === 'PGRST116' || !profile) {
        console.warn(`[verifyUser] Profile missing for ${userId}, triggering self-heal...`);
        const healed = await selfHealUser(userId, email);
        if (healed) {
            // Re-fetch after healing
            const { data: newProfile, error: retryError } = await supabaseAdmin
                .schema('public')
                .from(TABLES.USERS)
                .select('*')
                .eq('id', userId)
                .single();
            profile = newProfile;
            profileError = retryError;
        }
    }

    if (profileError || !profile) {
        if (!options.strict) {
            return {
                uid: userId,
                email: email,
                role: 'member',
                isInitial: true
            };
        }
        return null;
    }

    const sanitizeUUID = (val: any) => {
        if (!val || val === 'undefined' || val === 'null' || typeof val !== 'string') return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val) ? val : null;
    };

    // 4. Fetch Institutional Roles
    const { data: roles, error: rolesError } = await supabaseAdmin
        .from('user_institutions')
        .select('institution_id, role')
        .eq('user_id', userId);

    const institutionRoles: Record<string, string> = {};
    if (roles) {
        roles.forEach((r: any) => {
            institutionRoles[r.institution_id] = r.role;
        });
    }

    const authUser: AuthenticatedUser = {
        uid: userId,
        email: email || profile.email,
        name: profile.full_name || profile.name || email?.split('@')[0] || 'User',
        role: profile.role,
        institution_id: sanitizeUUID(profile.institution_id),
        allowed_institutions: profile.allowed_institutions || [],
        institutionRoles, // Map of inst_id -> role
        tenant_id: sanitizeUUID(profile.tenant_id),
        tenantId: sanitizeUUID(profile.tenant_id),
    };

    const logMsg = `[${new Date().toISOString()}] Path: ${new URL(req.url).pathname}, User: ${authUser.uid}, Role: ${authUser.role}, Tenant: ${authUser.tenant_id} (${typeof authUser.tenant_id})\n`;
    try {
        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(path.join(process.cwd(), 'auth_debug.log'), logMsg);
    } catch (e) { }

    console.log(`[verifyUser] 🏁 Returning user for ${new URL(req.url).pathname}:`, {
        uid: authUser.uid,
        role: authUser.role,
        institutionRoles,
        tenant_id: authUser.tenant_id
    });

    return authUser;
}

/**
 * getSupabaseFromRequest - Returns a Supabase client authenticated via the request header.
 */
export async function getSupabaseFromRequest(req: Request) {
    return await createServerSupabaseClient();
}

/**
 * getSupabaseAdmin - Returns a Supabase client with service role privileges.
 */
export function getSupabaseAdmin() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('[FATAL] SUPABASE_SERVICE_ROLE_KEY is not set. All API routes will fail. Check your .env.local file.');
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

/**
 * authorizeByPermission - Checks if the authenticated user has a specific permission.
 */
export async function authorizeByPermission(request: Request, permission: Permission) {
    const user = await verifyUser(request);
    if (!user) return { authorized: false, user: null };
    const authorized = hasPermission(user.role as Role, permission);
    return { authorized, user };
}
/**
 * verifyAdmin - Helper for admin-only API routes.
 */
export async function verifyAdmin(req: Request) {
    const user = await verifyUser(req);
    if (!user) {
        return { 
            authorized: false, 
            response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) 
        };
    }

    const isAdmin = user.role === 'admin' || user.role === 'owner';
    if (!isAdmin) {
        return { 
            authorized: false, 
            response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) 
        };
    }

    return { authorized: true, user };
}
