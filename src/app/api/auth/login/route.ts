// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logSystemActivity } from "@/lib/server/activity-logger";


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    let idToken = "";
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing ID token" }, { status: 401 });
        }

        idToken = authHeader.split("Bearer ")[1];

        // Verify the ID token first
        try {
    let decodedToken;
try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
} catch (error) {
    console.error('ID token verification failed:', error);
    return NextResponse.json({ error: 'Invalid or expired credentials' }, { status: 401 });
}
} catch (error) {
    console.error('ID token verification failed:', error);
    return NextResponse.json({ error: 'Invalid or expired credentials' }, { status: 401 });
}
        if (decodedToken === null || decodedToken === undefined) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Create session cookie
        // 5 days expiration
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        let sessionCookie; try { sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn }); } catch (error) { console.error('Failed to create session cookie:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }

        // Create response
        let existingSessionCookie; try { existingSessionCookie = await adminAuth.getSession(decodedToken.uid); } catch (error) { console.error('Failed to check for existing session:', error); }

if (existingSessionCookie) {
    return NextResponse.json({ error: "User is already logged in" }, { status: 409 });
}

const response = NextResponse.json({ status: "success", uid: decodedToken.uid });

        // Set cookie on response
        response.cookies.set("__session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            path: "/",
            sameSite: "lax",
            domain: process.env.COOKIE_DOMAIN || undefined,
        });

        // Log Login Activity
        await logSystemActivity({
            actorId: decodedToken.uid,
            actorRole: (decodedToken.role as string) || 'viewer',
            action: 'user_login',
            entityType: 'user',
            entityId: decodedToken.uid,
            summary: `User logged in: ${decodedToken.email || 'Unknown Email'}`,
            source: 'system',
            severity: 'info',
            visibility: { mode: 'admin' },
            metadata: {
                method: 'email',
                email: decodedToken.email
            }
        });

        return response;
    } catch (error: any) {
        console.error("Login session creation failed:", error);
        
        // Distinguish between authentication failures and unexpected server errors
        const isAuthError = error.code?.startsWith('auth/') || 
                            String(error.message).toLowerCase().includes('invalid-id-token') || 
                            String(error.message).toLowerCase().includes('id-token-expired');
                            
        if (isAuthError) {
            return NextResponse.json({ error: "Invalid or expired credentials" }, { status: 401 });
        }
        
        // Handle unexpected server errors safely without leaking internal details
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
