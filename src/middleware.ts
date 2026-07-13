// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from 'next/server';

// Environment-specific trusted origins
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://mediahive-app.vercel.app',
  'https://mediahive.thaiba.org',
  'capacitor://localhost',
  'file://',
  'mediahive://login',
  'mediahive://',
]);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith('/api/');

    const origin = request.headers.get('origin') || '';
    const method = request.method;

    // 1. CORS Allowlist Validation
    const isAllowedOrigin = ALLOWED_ORIGINS.has(origin);
    const corsOrigin = isAllowedOrigin ? origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // 2. CORS Preflight Handling (Fast path for OPTIONS)
    if (isApiRoute && method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });

        response.headers.set('Access-Control-Allow-Origin', corsOrigin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-institution-id');
        response.headers.set('Access-Control-Max-Age', '86400'); // Cache 24h
        response.headers.set('Access-Control-Allow-Credentials', 'true');

        return response;
    }

    // 3. State-Changing CSRF Check (Strict check for cookies, exempt for custom headers like Authorization Bearer)
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const hasAuthHeader = request.headers.has('Authorization');
    const hasCookieAuth = request.cookies.has('access_token') || request.cookies.has('sb-access-token');

    if (isApiRoute && isStateChanging && hasCookieAuth && !hasAuthHeader) {
        // Enforce strict Origin match if cookies are used without Authorization headers
        if (!origin || !isAllowedOrigin) {
            return NextResponse.json(
                { error: 'Security Block: CSRF verification failed.' },
                { status: 403 }
            );
        }
    }

    // 4. Initialize response and perform Supabase SSR Session Refresh
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            const supabase = createServerClient(
                supabaseUrl,
                supabaseAnonKey,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll();
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                            response = NextResponse.next({
                                request: {
                                    headers: request.headers,
                                },
                            });
                            cookiesToSet.forEach(({ name, value, options }) =>
                                response.cookies.set(name, value, options)
                            );
                        },
                    },
                }
            );

            // This refreshes the session if expired and updates cookies in the response
            await supabase.auth.getUser();
        } catch (err) {
            console.error('[MIDDLEWARE] Supabase session refresh failed:', err);
        }
    }

    // 5. Apply CORS headers for other API methods (GET, POST, etc.)
    if (isApiRoute) {
        response.headers.set('Access-Control-Allow-Origin', corsOrigin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-institution-id');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // 6. Security Headers (OWASP Recommendations)
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
