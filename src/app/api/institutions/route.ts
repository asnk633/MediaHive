import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { Institution } from '@/types/structure';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Public access allowed for registration
    // await requireAdminWithVerifiedEmail(request);

    const url = new URL(request.url);
    const showArchived = url.searchParams.get('archived') === 'true';

    const db = adminDb;
    const snapshot = await db.collection('institutions').get();

    const institutions = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Institution))
      .filter(inst => showArchived || inst.status === 'active');

    return Response.json({ institutions });
  } catch (error: any) {
    console.error('Error fetching institutions:', error);
    return Response.json({ error: error.message || 'Failed to fetch institutions' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWithVerifiedEmail(request);

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json({ error: 'Institution name is required' }, { status: 400 });
    }

    const db = adminDb;
    const newDocRef = db.collection('institutions').doc();

    const newInstitution: Omit<Institution, 'id'> = {
      name: name.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await newDocRef.set(newInstitution);

    return Response.json({
      id: newDocRef.id,
      ...newInstitution
    });

  } catch (error: any) {
    console.error('Error creating institution:', error);
    return Response.json({ error: error.message || 'Failed to create institution' }, { status: 403 });
  }
}
