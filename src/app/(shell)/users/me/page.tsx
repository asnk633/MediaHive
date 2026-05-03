import { redirect } from 'next/navigation';

/**
 * /users/me - Legacy or mistakenly used route.
 * Redirects to the canonical /profile page.
 */
export default function UsersMeRedirect() {
    redirect('/profile');
    return null;
}
