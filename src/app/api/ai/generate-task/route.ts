// src/app/api/ai/generate-task/route.ts
// AI endpoint to generate task suggestions

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { verifyUser } from '@/lib/server/server-utils';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Authorize user
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Security guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      console.error(`[POST /api/ai/generate-task] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    // Get task data from request body
    const { title, description } = await req.json();

    // In a real implementation, this would call an AI service
    // For now, we'll return mock suggestions

    // Mock AI suggestions
    const suggestions = {
      suggestedTitle: title ? `Enhanced: ${title}` : 'Suggested Task Title',
      suggestedDescription: description || 'This is an AI-generated task description based on the provided information.',
      suggestedPriority: 'medium',
      suggestedStatus: 'todo'
    };

    // Return AI suggestions
    return NextResponse.json(
      {
        success: true,
        suggestions
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/ai/generate-task]', error);
    return NextResponse.json(
      { error: 'Failed to generate task suggestions' },
      { status: 500 }
    );
  }
}
