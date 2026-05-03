import { NextRequest } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';

/**
 * Server-side email verification guard
 * Enforces email verification on server-side for sensitive operations.
 */
export async function requireEmailVerification(
  request: NextRequest,
  actionDescription: string = 'perform this action'
) {
  const user = await verifyUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Server-side admin guard with email verification
 * Enforces both admin status and email verification for admin operations.
 */
export async function requireAdminWithVerifiedEmail(request: NextRequest) {
  const user = await verifyUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if user has admin role
  if (user.role !== 'admin' && !(user as any).isAdmin) {
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * Server-side role change guard with email verification
 */
export async function requireVerifiedEmailForRoleChange(request: NextRequest) {
  return requireEmailVerification(request, 'change user roles');
}
