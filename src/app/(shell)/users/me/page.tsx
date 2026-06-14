import { serverRedirect } from '@/lib/server-redirect';

/**
 * /users/me - Legacy or mistakenly used route.
 * Redirects to the canonical /profile page.
 */
export default function UsersMeRedirect() {
    serverRedirect('/profile');
    return null;
}
