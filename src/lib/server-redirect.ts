import { redirect } from 'next/navigation';

/**
 * Capacitor-safe redirect helper.
 * This runs strictly on the Next.js server context, never inside the Capacitor WebView shell.
 * It encapsulates the restricted redirect() syntax so we only need to disable the ESLint rule once.
 */
export const serverRedirect = (path: string): never => {
    // eslint-disable-next-line no-restricted-syntax
    redirect(path);
};
