import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './auth';

export type PrimaryRole = 'admin' | 'team' | 'guest';
export interface UserRole { role: PrimaryRole; tags: string[]; }

export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, 'roles', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserRole;
  return { role: 'guest', tags: [] };
}

export async function setUserRole(uid: string, role: UserRole) {
  const ref = doc(db, 'roles', uid);
  await setDoc(ref, role, { merge: true });
}
