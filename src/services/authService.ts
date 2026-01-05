import 'server-only';
import { adminAuth } from '@/lib/firebase/server';

export async function verifyUser(request: Request) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    return await adminAuth.verifyIdToken(token);
}
