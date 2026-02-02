import 'server-only';
import admin from 'firebase-admin';

// Validates that we are running in a server context
if (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    // console.warn('Values for FIREBASE_PROJECT_ID (or FIREBASE_ADMIN_PROJECT_ID) are missing.');
}

let adminApp: admin.app.App | undefined;

try {
    // Implement Singleton Pattern to reuse the same admin instance across hot reloads
    if (admin.apps.length > 0) {
        adminApp = admin.apps[0]!;
    } else {
        // Direct env check is safer than importing config here to avoid circular dep or alias issues in server-only context
        const IS_EMULATOR = process.env.NEXT_PUBLIC_DATA_MODE === 'emulator';

        // EMULATOR CONFIGURATION
        if (IS_EMULATOR) {
            console.log('[FIREBASE ADMIN] 🔧 Using FIRESTORE EMULATOR (localhost:8080)');
            process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
            process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
            process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

            // In emulator mode, we can initialize with dummy credentials
            adminApp = admin.initializeApp({
                projectId: 'thaiba-media-staging', // Use staging ID for emulator
            });
        }
        // PRODUCTION CONFIGURATION
        else {
            const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
            // Handle private key replacement for Vercel/System env vars
            const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

            if (projectId && clientEmail && privateKey) {
                console.log('[FIREBASE ADMIN] Initializing with cert for:', projectId);

                // Explicit guard: Check for mismatch
                if (projectId !== 'thaiba-media-prod') {
                    console.warn(`[FIREBASE ADMIN] WARNING: Project ID mismatch! Expected 'thaiba-media-prod', got '${projectId}'`);
                }

                adminApp = admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                    projectId: projectId, // Explicitly set projectId
                });
            } else {
                // Log critical failure elements (redacted)
                console.error('[FIREBASE ADMIN] CRITICAL: Missing Env Vars', {
                    hasProjectId: !!projectId,
                    hasClientEmail: !!clientEmail,
                    hasPrivateKey: !!privateKey
                });
                console.warn('Firebase Admin Env Vars Missing. App will crash if DB accessed.');
            }
        }
    }
} catch (error) {
    console.error('Firebase Admin Init Error:', error);
}

if (adminApp) {
    console.log('[FIREBASE ADMIN] Server Instance Ready. Project ID:', adminApp.options.projectId);
}

// Helper proxy to throw error on access if not initialized
const createProxy = <T extends object>(name: string): T => {
    return new Proxy({} as T, {
        get: (_target, prop) => {
            if (!adminApp) {
                throw new Error(`Firebase Admin (${name}) accessed but not initialized. Check server logs for missing credentials.`);
            }
            // If initialized, this proxy shouldn't strictly be used if we export direct refs?
            // Actually, we can't switch the export value dynamically.
            // So we must use a getter or proxy for the export itself?
            // No, easier:
            // return (adminApp as any)[name]()[prop]; // This is getting complicated
            return Reflect.get((adminApp as any)[name](), prop);
        }
    });
};

// If valid, export real instance. If not, export proxy that throws on usage.
// Note: We can't export "conditional" types easily.
// But mostly we blindly export methods.

export const adminAuth = adminApp ? adminApp.auth() : createProxy<admin.auth.Auth>('auth');
export const adminDb = adminApp ? adminApp.firestore() : createProxy<admin.firestore.Firestore>('firestore');
export const adminStorage = adminApp ? adminApp.storage() : createProxy<admin.storage.Storage>('storage');
export const adminMessaging = adminApp ? adminApp.messaging() : createProxy<admin.messaging.Messaging>('messaging');

// Strict Server-Only Exports
export { adminApp as admin };
