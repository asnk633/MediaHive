// src/app/api/perf/reports/route.ts
// API endpoint to list and serve performance reports (dev-only)

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Protect dev-only endpoint
const isDev = process.env.NODE_ENV !== 'production';
const perfDashboardEnabled = process.env.PERF_DASHBOARD_ENABLED === 'true';

export async function GET(request: NextRequest) {
  // Only allow in development or when explicitly enabled
  if (!isDev && !perfDashboardEnabled) {
    return NextResponse.json(
      { error: 'Performance dashboard only available in development' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportDate = searchParams.get('date');
    const reportType = searchParams.get('type') || 'summary';
    
    const reportsDir = path.join(process.cwd(), 'reports', 'performance');
    
    // If no date specified, get latest report
    let targetDir = path.join(reportsDir, 'latest');
    if (reportDate) {
      targetDir = path.join(reportsDir, reportDate);
    }
    
    // Check if directory exists
    if (!fs.existsSync(targetDir)) {
      // Try to find the latest date directory
      if (fs.existsSync(reportsDir)) {
        const dateDirs = fs.readdirSync(reportsDir)
          .filter(dir => dir.match(/^\d{4}-\d{2}-\d{2}$/))
          .sort()
          .reverse();
        
        if (dateDirs.length > 0) {
          targetDir = path.join(reportsDir, dateDirs[0]);
        } else {
          return NextResponse.json(
            { error: 'No performance reports found' },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Performance reports directory not found' },
          { status: 404 }
        );
      }
    }
    
    // Serve specific report type
    switch (reportType) {
      case 'summary':
        const summaryPath = path.join(targetDir, 'summary.md');
        if (fs.existsSync(summaryPath)) {
          const content = fs.readFileSync(summaryPath, 'utf8');
          return NextResponse.json({
            content,
            type: 'markdown',
            date: path.basename(targetDir)
          });
        }
        break;
        
      case 'lighthouse-json':
        const lighthouseJsonPath = path.join(targetDir, 'lighthouse.json');
        if (fs.existsSync(lighthouseJsonPath)) {
          const content = fs.readFileSync(lighthouseJsonPath, 'utf8');
          return new NextResponse(content, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        break;
        
      case 'lighthouse-html':
        const lighthouseHtmlPath = path.join(targetDir, 'lighthouse.html');
        if (fs.existsSync(lighthouseHtmlPath)) {
          const content = fs.readFileSync(lighthouseHtmlPath, 'utf8');
          return new NextResponse(content, {
            headers: {
              'Content-Type': 'text/html'
            }
          });
        }
        break;
        
      case 'autocannon':
        const autocannonPath = path.join(targetDir, 'autocannon.json');
        if (fs.existsSync(autocannonPath)) {
          const content = fs.readFileSync(autocannonPath, 'utf8');
          return new NextResponse(content, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        break;
        
      case 'list':
        // List all available reports
        if (fs.existsSync(reportsDir)) {
          const dirs = fs.readdirSync(reportsDir)
            .filter(dir => dir.match(/^\d{4}-\d{2}-\d{2}$/) || dir === 'latest')
            .sort()
            .reverse();
          
          return NextResponse.json({
            reports: dirs,
            latest: dirs.includes('latest') ? 'latest' : dirs[0] || null
          });
        }
        break;
    }
    
    return NextResponse.json(
      { error: `Report type '${reportType}' not found` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error serving performance report:', error);
    return NextResponse.json(
      { error: 'Failed to serve performance report' },
      { status: 500 }
    );
  }
}
