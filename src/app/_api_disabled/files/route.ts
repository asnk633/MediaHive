import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { files } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_VISIBILITY_VALUES = ['all', 'team', 'guest'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const file = await db.select()
        .from(files)
        .where(eq(files.id, parseInt(id)))
        .limit(1);

      if (file.length === 0) {
        return NextResponse.json({
          error: 'File not found',
          code: 'FILE_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(file[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const visibility = searchParams.get('visibility');
    const folder = searchParams.get('folder');
    const institutionId = searchParams.get('institutionId');
    const uploadedById = searchParams.get('uploadedById');

    let query = db.select().from(files);

    const conditions = [];

    // Search by name
    if (search) {
      conditions.push(like(files.name, `%${search}%`));
    }

    // Filter by visibility
    if (visibility) {
      conditions.push(eq(files.visibility, visibility));
    }

    // Filter by folder
    if (folder) {
      conditions.push(eq(files.folder, folder));
    }

    // Filter by institutionId
    if (institutionId && !isNaN(parseInt(institutionId))) {
      conditions.push(eq(files.institutionId, parseInt(institutionId)));
    }

    // Filter by uploadedById
    if (uploadedById && !isNaN(parseInt(uploadedById))) {
      conditions.push(eq(files.uploadedById, parseInt(uploadedById)));
    }

    if (conditions.length > 0) {
      // Cast to any to bypass transient drizzle/TS inference mismatch.
      query = (query.where(and(...conditions)) as unknown) as any;
    }

    const results = await query
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({
        error: 'Name is required and must be a non-empty string',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }

    if (!body.fileUrl || typeof body.fileUrl !== 'string' || body.fileUrl.trim() === '') {
      return NextResponse.json({
        error: 'File URL is required and must be a non-empty string',
        code: 'MISSING_FILE_URL'
      }, { status: 400 });
    }

    if (!body.fileType || typeof body.fileType !== 'string' || body.fileType.trim() === '') {
      return NextResponse.json({
        error: 'File type is required and must be a non-empty string',
        code: 'MISSING_FILE_TYPE'
      }, { status: 400 });
    }

    if (!body.fileSize || typeof body.fileSize !== 'number' || isNaN(body.fileSize)) {
      return NextResponse.json({
        error: 'File size is required and must be a valid integer',
        code: 'INVALID_FILE_SIZE'
      }, { status: 400 });
    }

    if (!body.visibility || !VALID_VISIBILITY_VALUES.includes(body.visibility)) {
      return NextResponse.json({
        error: `Visibility is required and must be one of: ${VALID_VISIBILITY_VALUES.join(', ')}`,
        code: 'INVALID_VISIBILITY'
      }, { status: 400 });
    }

    if (!body.uploadedById || typeof body.uploadedById !== 'number' || isNaN(body.uploadedById)) {
      return NextResponse.json({
        error: 'Uploaded by ID is required and must be a valid integer',
        code: 'INVALID_UPLOADED_BY_ID'
      }, { status: 400 });
    }

    if (!body.institutionId || typeof body.institutionId !== 'number' || isNaN(body.institutionId)) {
      return NextResponse.json({
        error: 'Institution ID is required and must be a valid integer',
        code: 'INVALID_INSTITUTION_ID'
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      name: body.name.trim(),
      fileUrl: body.fileUrl.trim(),
      fileType: body.fileType.trim(),
      fileSize: body.fileSize,
      visibility: body.visibility,
      uploadedById: body.uploadedById,
      institutionId: body.institutionId,
      tenantId: 1, // Default tenant ID for now
      createdAt: new Date().toISOString(),
    };

    // Add optional folder field if provided
    if (body.folder && typeof body.folder === 'string') {
      insertData.folder = body.folder.trim();
    }

    const newFile = await db.insert(files)
      .values(insertData)
      .returning();

    return NextResponse.json(newFile[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if file exists
    const existingFile = await db.select()
      .from(files)
      .where(eq(files.id, parseInt(id)))
      .limit(1);

    if (existingFile.length === 0) {
      return NextResponse.json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json({
          error: 'Name must be a non-empty string',
          code: 'INVALID_NAME'
        }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.fileUrl !== undefined) {
      if (typeof body.fileUrl !== 'string' || body.fileUrl.trim() === '') {
        return NextResponse.json({
          error: 'File URL must be a non-empty string',
          code: 'INVALID_FILE_URL'
        }, { status: 400 });
      }
      updates.fileUrl = body.fileUrl.trim();
    }

    if (body.fileType !== undefined) {
      if (typeof body.fileType !== 'string' || body.fileType.trim() === '') {
        return NextResponse.json({
          error: 'File type must be a non-empty string',
          code: 'INVALID_FILE_TYPE'
        }, { status: 400 });
      }
      updates.fileType = body.fileType.trim();
    }

    if (body.fileSize !== undefined) {
      if (typeof body.fileSize !== 'number' || isNaN(body.fileSize)) {
        return NextResponse.json({
          error: 'File size must be a valid integer',
          code: 'INVALID_FILE_SIZE'
        }, { status: 400 });
      }
      updates.fileSize = body.fileSize;
    }

    if (body.folder !== undefined) {
      if (body.folder === null) {
        updates.folder = null;
      } else if (typeof body.folder === 'string') {
        updates.folder = body.folder.trim();
      } else {
        return NextResponse.json({
          error: 'Folder must be a string or null',
          code: 'INVALID_FOLDER'
        }, { status: 400 });
      }
    }

    if (body.visibility !== undefined) {
      if (!VALID_VISIBILITY_VALUES.includes(body.visibility)) {
        return NextResponse.json({
          error: `Visibility must be one of: ${VALID_VISIBILITY_VALUES.join(', ')}`,
          code: 'INVALID_VISIBILITY'
        }, { status: 400 });
      }
      updates.visibility = body.visibility;
    }

    if (body.uploadedById !== undefined) {
      if (typeof body.uploadedById !== 'number' || isNaN(body.uploadedById)) {
        return NextResponse.json({
          error: 'Uploaded by ID must be a valid integer',
          code: 'INVALID_UPLOADED_BY_ID'
        }, { status: 400 });
      }
      updates.uploadedById = body.uploadedById;
    }

    if (body.institutionId !== undefined) {
      if (typeof body.institutionId !== 'number' || isNaN(body.institutionId)) {
        return NextResponse.json({
          error: 'Institution ID must be a valid integer',
          code: 'INVALID_INSTITUTION_ID'
        }, { status: 400 });
      }
      updates.institutionId = body.institutionId;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update',
        code: 'NO_UPDATES'
      }, { status: 400 });
    }

    const updatedFile = await db.update(files)
      .set(updates)
      .where(eq(files.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedFile[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if file exists
    const existingFile = await db.select()
      .from(files)
      .where(eq(files.id, parseInt(id)))
      .limit(1);

    if (existingFile.length === 0) {
      return NextResponse.json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(files)
      .where(eq(files.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'File deleted successfully',
      file: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}