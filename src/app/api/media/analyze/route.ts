// src/app/api/media/analyze/route.ts
// Media Quality Analyzer API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mediaReports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { config } from '@/lib/config';
import { analyzeMediaQuality } from '@/lib/mediaAnalyzer';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import path from 'path';
import fs from 'fs/promises';
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Create directories if they don't exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create directories:', error);
  }
}

// Clean up old files based on retention policy
async function cleanupOldFiles() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.MEDIA_UPLOAD_RETENTION_DAYS);
    
    // Clean up old uploads
    const uploadFiles = await fs.readdir(UPLOADS_DIR);
    for (const file of uploadFiles) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = await fs.stat(filePath);
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
      }
    }
    
    // Clean up old reports
    const reportFiles = await fs.readdir(REPORTS_DIR);
    for (const file of reportFiles) {
      const filePath = path.join(REPORTS_DIR, file);
      const stats = await fs.stat(filePath);
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.warn('Cleanup error:', error);
  }
}

// POST /api/media/analyze - Analyze media quality

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Check if feature is enabled
  if (!config.FEATURE_MEDIA_ANALYZER) {
    return NextResponse.json(
      { error: 'Media analyzer feature is disabled' },
      { status: 404 }
    );
  }
  
  try {
    // Ensure directories exist
    await ensureDirectories();
    
    // Clean up old files
    await cleanupOldFiles();
    
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
    const file_id = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const tempFileName = `${file_id}.${fileExtension}`;
    const tempFilePath = path.join(UPLOADS_DIR, tempFileName);
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);
    
    // Analyze media quality
    const qualityReport = await analyzeMediaQuality(tempFilePath, file.type);
    
    // Save report to database
    const [report] = await db
      .insert(mediaReports)
      .values({
        filename: file.name,
        uploaderId: 1, // In a real implementation, this would come from the authenticated user
        type: qualityReport.type,
        score: qualityReport.score,
        reportJson: JSON.stringify(qualityReport),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();
    
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn('Temporary file cleanup error:', cleanupError);
    }
    
    return NextResponse.json(qualityReport, { status: 200 });
  } catch (error: unknown) {
    console.error('Media analysis error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to analyze media: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to analyze media: Unknown error' },
        { status: 500 }
      );
    }
  }
}

// GET /api/media/analyze/:id - Get previous report
export async function GET(
  request: NextRequest,
  context: { params: Promise<{}> }
) {  
  // Check if feature is enabled
  if (!config.FEATURE_MEDIA_ANALYZER) {
    return NextResponse.json(
      { error: 'Media analyzer feature is disabled' },
      { status: 404 }
    );
  }
  
  try {
    const params = await context.params as { id: string };
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    // Fetch report from database
    const reports = await db
      .select()
      .from(mediaReports)
      .where(eq(mediaReports.id, id))
      .limit(1);
    
    if (reports.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    const report = reports[0];
    const qualityReport = JSON.parse(report.reportJson as string);
    
    return NextResponse.json(qualityReport, { status: 200 });
  } catch (error: unknown) {
    console.error('Get report error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch report: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch report: Unknown error' },
        { status: 500 }
      );
    }
  }
}
