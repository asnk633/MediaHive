// src/app/api/test-utils/seed-user/route.ts
import fs from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';
import admin from 'firebase-admin';

/**
 * Helper: initialize Firebase Admin using either FIREBASE_ADMIN_SA (base64 JSON)
 * or FIREBASE_ADMIN_SA_PATH (file path to JSON). Returns true if we initialized.
 */
function initFirebaseAdmin(): boolean {
    if (admin.apps && admin.apps.length > 0) return true;

    const envB64 = process.env.FIREBASE_ADMIN_SA;
    const envPath = process.env.FIREBASE_ADMIN_SA_PATH;

    try {
        if (envB64) {
            const json = JSON.parse(Buffer.from(envB64, 'base64').toString('utf8'));
            admin.initializeApp({ credential: admin.credential.cert(json as any) });
            return true;
        }

        if (envPath) {
            const full = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
            if (!fs.existsSync(full)) {
                console.warn('FIREBASE_ADMIN_SA_PATH file not found:', full);
                return false;
            }
            const raw = fs.readFileSync(full, 'utf8');
            const json = JSON.parse(raw);
            admin.initializeApp({ credential: admin.credential.cert(json as any) });
            return true;
        }

        // try a common location
        const fallback = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(fallback)) {
            const json = JSON.parse(fs.readFileSync(fallback, 'utf8'));
            admin.initializeApp({ credential: admin.credential.cert(json as any) });
            return true;
        }
    } catch (err) {
        console.error('Failed initializing firebase-admin:', err);
        return false;
    }

    return false;
}

/**
 * POST handler to create or ensure a test user exists.
 * Body: { email: string, password: string, role?: string }
 */
export async function POST(req: NextRequest) {
    // only allow local/dev runs
    const host = req.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    if (!isLocal) {
        return new Response(JSON.stringify({ ok: false, error: 'seed route allowed only on local/dev' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
        });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body && body.email) || process.env.E2E_TEST_EMAIL;
    const password = (body && body.password) || process.env.E2E_TEST_PW;
    const role = (body && body.role) || 'admin';

    if (!email || !password) {
        return new Response(JSON.stringify({ ok: false, error: 'email and password required' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
        });
    }

    const ok = initFirebaseAdmin();
    if (!ok) {
        return new Response(
            JSON.stringify({
                ok: false,
                error:
                    'Firebase Admin not configured. Provide FIREBASE_ADMIN_SA (base64 JSON) or FIREBASE_ADMIN_SA_PATH (file path) or place service-account.json at project root.',
            }),
            { status: 501, headers: { 'content-type': 'application/json' } }
        );
    }

    try {
        // if user exists, return success
        try {
            const existing = await admin.auth().getUserByEmail(email);
            // Ensure custom claims (role) if needed
            if (role) {
                await admin.auth().setCustomUserClaims(existing.uid, { role });
            }
            return new Response(JSON.stringify({ ok: true, uid: existing.uid, existed: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        } catch {
            // not found -> create
        }

        const user = await admin.auth().createUser({
            email,
            password,
            emailVerified: true,
            disabled: false,
        });

        if (role) {
            await admin.auth().setCustomUserClaims(user.uid, { role });
        }

        return new Response(JSON.stringify({ ok: true, uid: user.uid }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
        });
    } catch (err: any) {
        console.error('seed-user failed:', err);
        return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
