import { serverRedirect } from '@/lib/server-redirect';

export default function UsersRedirect() {
    serverRedirect('/admin/users');
    return null;
}
