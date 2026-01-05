import { verifyUser } from '@/lib/server-utils';
import { hasPermission, Permission, Role } from '@/lib/permissions';

export async function authorizeByPermission(permission: Permission) {
    // verifyUser uses cookies() internally and ignores the request arg in the current implementation.
    // We pass a dummy request to satisfy the signature.
    const req = new Request('http://localhost');
    const user = await verifyUser(req);

    if (!user) {
        return { authorized: false, user: null };
    }

    const role = user.role as Role;
    if (!role) {
        return { authorized: false, user };
    }

    if (hasPermission(role, permission)) {
        return { authorized: true, user };
    }

    return { authorized: false, user };
}
