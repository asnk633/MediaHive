import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { verifyUser } from '@/lib/verifyUser';
import { writeFile } from 'fs/promises';
import path from 'path';

/**
 * POST /api/upload/attachment
 * Upload file attachment for tasks
 * Multipart form data: file, taskId
 */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await verifyUser(req);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Security Guard
    const tenantId = user?.tenant_id ?? null;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      console.error(`[POST /api/upload/attachment] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = (formData.get('file') ?? null) as File | null;
    const taskId = formData.get('taskId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json({ error: 'Valid task ID required' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const basename = path.basename(file.name, ext);
    const safeFilename = `${basename}_${timestamp}${ext}`;

    // Save file to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, safeFilename);

    try {
      // Create directory if it doesn't exist
      const { mkdir } = await import('fs/promises');
      await mkdir(uploadDir, { recursive: true });

      // Write file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error('File write error:', writeError);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }

    // Save to database
    const fileUrl = `/uploads/${safeFilename}`;
    const now = new Date().toISOString();

    const inserted = await db
      .insert(attachments)
      .values({
        taskId: parseInt(taskId),
        file_name: file.name,
        fileUrl,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedById: user.uid,
        tenantId: typeof tenantId === 'string' && !isNaN(Number(tenantId)) ? Number(tenantId) : tenantId as any,
        created_at: now,
      })
      .returning();

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/upload/attachment]', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/attachment?taskId=123
 * Get attachments for a task
 */
export async function GET(req: NextRequest) {
  try {
    let user; try { user = await verifyUser(req); } catch (error) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Security Guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      console.error(`[GET /api/upload/attachment] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json({ error: 'Valid task ID required' }, { status: 400 });
    }

    const { eq, and } = await import('drizzle-orm');
    const taskAttachments = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.taskId, parseInt(taskId)),
          eq(attachments.tenantId, typeof tenantId === 'string' && !isNaN(Number(tenantId)) ? Number(tenantId) : tenantId as any)
        )
      );

    return NextResponse.json({ data: taskAttachments }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/upload/attachment]', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
