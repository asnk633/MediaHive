/**
 * Environment Guard Utilities
 * 
 * Helper functions to ensure operations run in the correct environment
 * and to prevent destructive actions in production.
 */

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';

export function requireProduction() {
    if (!isProduction()) {
        throw new Error('This operation is only allowed in production environment.');
    }
}

export function preventProduction(operationName: string) {
    // Check typical production indicators
    const isProd = isProduction() ||
        process.env.NEXT_PUBLIC_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production';

    if (isProd) {
        throw new Error(`Operation '${operationName}' is BLOCKED in production environment.`);
    }
}

/**
 * Validates that critical environment variables are present
 * @param required - Array of required environment variable keys
 */
export function validateEnv(required: string[]) {
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
