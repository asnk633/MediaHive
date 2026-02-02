import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '';

    // Define allowed origins
    // In development, we allow localhost:3000
    // In production, we should ideally restrict this, but for now we follow the plan to allow requisite origins
    const allowedOrigins = [
        'http://localhost:3000',
        'https://thaiba-garden-media-manager.vercel.app'
    ];

    // Check if the origin is allowed, or allow all if strictly needed (though specific is better)
    const isAllowedOrigin = allowedOrigins.includes(origin) || !origin; // !origin handles server-to-server or non-browser reqs often, but for CORS usually origin is present.

    // Handle OPTIONS method (Preflight)
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });

        // Set CORS headers
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-institution-id');
        response.headers.set('Access-Control-Max-Age', '86400'); // Cache 24h
        response.headers.set('Access-Control-Allow-Credentials', 'true');

        return response;
    }

    // Handle other methods
    const response = NextResponse.next();

    // Apply CORS headers to the response normal response as well
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-institution-id');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
