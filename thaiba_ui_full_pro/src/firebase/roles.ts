import { db } from './firebaseWrapper';

export type PrimaryRole = 'admin' | 'team' | 'guest';
export interface UserRole { role: PrimaryRole; tags: string[]; }

export async function getUserRole(uid: string): Promise<UserRole> {
  if (!db) return { role: 'guest', tags: [] };

  const snap = await db.collection('roles').doc(uid).get();
  if (snap.exists) {
    return snap.data() as UserRole;
  }
  return { role: 'guest', tags: [] };
}

export async function setUserRole(uid: string, role: UserRole) {
  if (!db) return;
  await db.collection('roles').doc(uid).set(role, { merge: true });
}
