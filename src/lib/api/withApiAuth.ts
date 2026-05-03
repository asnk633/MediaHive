import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, AuthenticatedUser } from '@/lib/verifyUser';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { apiError } from '@/lib/api-utils';
import { Role } from '@/lib/permissions';

export interface ApiAuthContext {
    request: NextRequest;
    user: AuthenticatedUser;
    tenantId: string;
    supabase: any; // Supabase client
}

export type ApiAuthHandler = (context: ApiAuthContext, params?: any) => Promise<NextResponse>;

export interface ApiAuthOptions {
    role?: Role | Role[];
}

/**
 * withApiAuth - Higher-order function to wrap API route handlers with authentication and tenant context.
 * 
 * @param handler The API route handler function.
 * @param options Options for role-based protection.
 */
export function withApiAuth(handler: ApiAuthHandler, options: ApiAuthOptions = {}) {
    return async (request: NextRequest, { params }: { params?: any } = {}) => {
        try {
            // 1. Verify User
            const user = await verifyUser(request);
            if (!user) {
                return apiError('Unauthorized', 401);
            }

            // 2. Validate Tenant
            const tenantId = user.tenant_id || user.tenantId;
            if (!tenantId) {
                console.error(`[withApiAuth] ❌ Missing tenant context for user ${user.uid}`);
                return apiError('Tenant context required', 403);
            }

            // 3. Optional Role Protection
            if (options.role) {
                const requiredRoles = Array.isArray(options.role) ? options.role : [options.role];
                const userRole = (user.role as string)?.toLowerCase() as Role;

                if (!requiredRoles.includes(userRole)) {
                    console.warn(`[withApiAuth] ⚠️ Forbidden access for user ${user.uid} (Role: ${userRole}, Required: ${requiredRoles.join(', ')})`);
                    return apiError('Forbidden: Insufficient permissions', 403);
                }
            }

            // 4. Initialize Supabase Admin
            const supabase = getSupabaseAdmin();

            // 5. Execute Handler
            return await handler({
                request,
                user,
                tenantId,
                supabase
            }, params);

        } catch (error: any) {
            console.error('[withApiAuth] 🔥 Internal Error:', error);
            return apiError(error.message || 'Internal Server Error', 500);
        }
    };
}
