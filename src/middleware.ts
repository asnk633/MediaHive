import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// NOTE: RateLimiterMemory in Next.js Middleware (Edge/Serverless) is ephemeral and per-instance.
// It effectively limits "bursts" to a single instance but isn't a distributed global rate limiter (which needs Redis).
// Given the constraints and dependencies, this provides basic protection against rapid flooding of a single endpoint.

const rateLimiter = new RateLimiterMemory({
    points: 200, // Increased from 20 to 200 to allow normal SPA traffic
    duration: 60, // Per 60 seconds
});

const authLimiter = new RateLimiterMemory({
    points: 50, // Increased from 10 to 50
    duration: 60, // Per 60 seconds
});

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Exclude Cron Jobs from middleware to prevent any interference (404s, rate limits, etc.)
    if (path.startsWith('/api/cron')) {
        return NextResponse.next();
    }

    // Perform rate limiting checks...
    if (path.startsWith('/api')) {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const requestId = crypto.randomUUID();

        // Attach requestId to headers for downstream
        request.headers.set('x-request-id', requestId);

        const start = Date.now();

        try {
            if (path.startsWith('/api/auth') || path.startsWith('/api/admin')) {
                await authLimiter.consume(ip);
            } else {
                await rateLimiter.consume(ip);
            }
        } catch (e) {
            console.log(JSON.stringify({
                level: 'warn',
                message: 'Rate Limit Exceeded',
                path,
                ip,
                requestId
            }));
            return new NextResponse('Too Many Requests', { status: 429 });
        }

        // Log Request (Post-processing logic is hard in middleware without response interception proxy, 
        // so we log request reception or we rely on 'waitUntil' if supported, but here we log entry).
        // For full latency, we usually use a wrapper in route handlers, but middleware can log start.
        // We will log "Request Started".
        console.log(JSON.stringify({
            level: 'info',
            message: 'API Request',
            path,
            method: request.method,
            ip,
            requestId
        }));
    }

    // Security Headers
    const response = NextResponse.next();

    // Pass request ID to response headers
    if (request.headers.get('x-request-id')) {
        response.headers.set('x-request-id', request.headers.get('x-request-id')!);
    }

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
