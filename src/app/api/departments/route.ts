import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { Department } from '@/types/structure';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Public access allowed for registration
    // await requireAdminWithVerifiedEmail(request);

    const url = new URL(request.url);
    const showArchived = url.searchParams.get('archived') === 'true';

    const db = adminDb;
    const snapshot = await db.collection('departments').get();

    const departments = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Department))
      .filter(dept => showArchived || dept.status === 'active');

    return Response.json({ departments });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return Response.json({ error: error.message || 'Failed to fetch departments' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWithVerifiedEmail(request);

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json({ error: 'Department name is required' }, { status: 400 });
    }

    const db = adminDb;
    const newDocRef = db.collection('departments').doc();

    const newDepartment: Omit<Department, 'id'> = {
      name: name.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await newDocRef.set(newDepartment);

    return Response.json({
      id: newDocRef.id,
      ...newDepartment
    });

  } catch (error: any) {
    console.error('Error creating department:', error);
    return Response.json({ error: error.message || 'Failed to create department' }, { status: 403 });
  }
}
