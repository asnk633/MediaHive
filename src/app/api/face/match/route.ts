// src/app/api/face/match/route.ts
// VIP Face Matching API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { config } from '@/lib/config';
import { matchFace } from '@/lib/faceRecognition';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import path from 'path';
import fs from 'fs/promises';
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Create directory if it doesn't exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create directories:', error);
  }
}

// POST /api/face/match - Match a face (authenticated users)
export async function POST(request: NextRequest) {
  // Check if feature is enabled
  if (!config.FEATURE_FACE_RECOGNITION) {
    return NextResponse.json(
      { error: 'Face recognition feature is disabled' },
      { status: 404 }
    );
  }
  
  try {
    // Authorize user with RBAC - authenticated users can match faces
    const user = await authorizeByPermission(request, 'read:tasks');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ensure directories exist
    await ensureDirectories();
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > config.MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${config.MAX_UPLOAD_SIZE} bytes` },
        { status: 400 }
      );
    }
    
    // Save file temporarily
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const tempFileName = `${fileId}.${fileExtension}`;
    const tempFilePath = path.join(UPLOADS_DIR, tempFileName);
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);
    
    // Match face
    const result = await matchFace(tempFilePath);
    
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn('Temporary file cleanup error:', cleanupError);
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('Face matching error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to match face: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to match face: Unknown error' },
        { status: 500 }
      );
    }
  }
}