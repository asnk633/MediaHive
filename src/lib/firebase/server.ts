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
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        // Handle private key replacement for Vercel/System env vars
        const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            // console.log('[FIREBASE ADMIN] Credentials detected: YES'); // Reduced verbosity for production
            console.log('[FIREBASE ADMIN] Initializing with cert...');
            adminApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                // projectId: projectId, // Omit to allow inference from cert and avoid mismatch
            });
        } else if (process.env.FIREBASE_ADMIN_SA_PATH) {
            // Fallback to Service Account Path (Native/Local dev)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = require(process.env.FIREBASE_ADMIN_SA_PATH);
            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Log but don't crash yet - allow build to proceed
            console.warn('Firebase Admin Env Vars Missing. App will crash if DB accessed.');
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
