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
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Create session cookie
        // 5 days expiration
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Create response
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
        
        // Explicit failure - do not create session cookie when verification fails
        return NextResponse.json({ error: "Unauthorized: " + error.message }, { status: 401 });
    }
}
