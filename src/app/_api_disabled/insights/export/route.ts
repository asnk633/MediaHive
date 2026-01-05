// src/app/api/insights/export/route.ts
// Insights Export API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '../../_lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const period = searchParams.get('period') || 'week';
    const tenantId = searchParams.get('tenant') || 'all';

    // In a real implementation, we would fetch actual data from the dashboard API
    // For now, we'll simulate calling the dashboard endpoint
    
    // Import and call the dashboard function directly
    const dashboardModule = await import('../dashboard/route');
    const dashboardReq = new NextRequest(`http://localhost:3000/api/insights/dashboard?period=${period}&tenant=${tenantId}`);
    const dashboardRes = await dashboardModule.GET(dashboardReq);
    const dashboardData = await dashboardRes.json();

    if (format === 'csv') {
      // Generate CSV content with real data
      const csvRows = [
        ['Report Type', 'Period', 'Tenant', 'Data'],
        ['Task Workload', period, tenantId, dashboardData.taskWorkload.map((item: any) => `${item.institution}: ${item.workload} tasks`).join(', ')],
        ['TAT Metrics', period, tenantId, `Average: ${dashboardData.tatMetrics.average}, Median: ${dashboardData.tatMetrics.median}`],
        ['SLA Compliance', period, tenantId, `${dashboardData.slaCompliance.compliant}% compliant, ${dashboardData.slaCompliance.nonCompliant}% non-compliant`],
        ['Event Frequency', period, tenantId, dashboardData.eventFrequency.map((item: any) => `${item.day}: ${item.count}`).join(', ')],
        ['Media Output', period, tenantId, dashboardData.mediaOutput.map((item: any) => `${item.month}: ${item.count}`).join(', ')],
        ['Team Activity', period, tenantId, dashboardData.teamActivity.map((item: any) => `${item.team}: ${item.activity}%`).join(', ')],
        ['Production Pipeline', period, tenantId, `In Progress: ${dashboardData.productionPipeline.inProgress}, Pending Review: ${dashboardData.productionPipeline.pendingReview}, Completed: ${dashboardData.productionPipeline.completed}, Delayed: ${dashboardData.productionPipeline.delayed}`]
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="insights-report-${period}.csv"`
        }
      });
    } else if (format === 'pdf') {
      // Generate PDF-like content with real data
      let pdfContent = `Insights Report
================

Period: ${period}
Tenant: ${tenantId === 'all' ? 'All Campuses' : tenantId}

Task Workload:
${dashboardData.taskWorkload.map((item: any) => `- ${item.institution}: ${item.workload} tasks`).join('\n')}

TAT Metrics:
- Average: ${dashboardData.tatMetrics.average}
- Median: ${dashboardData.tatMetrics.median}

SLA Compliance:
- ${dashboardData.slaCompliance.compliant}% compliant
- ${dashboardData.slaCompliance.nonCompliant}% non-compliant

Event Frequency:
${dashboardData.eventFrequency.map((item: any) => `- ${item.day}: ${item.count}`).join('\n')}

Media Output:
${dashboardData.mediaOutput.map((item: any) => `- ${item.month}: ${item.count}`).join('\n')}

Team Activity:
${dashboardData.teamActivity.map((item: any) => `- ${item.team}: ${item.activity}%`).join('\n')}

Production Pipeline:
- In Progress: ${dashboardData.productionPipeline.inProgress}
- Pending Review: ${dashboardData.productionPipeline.pendingReview}
- Completed: ${dashboardData.productionPipeline.completed}
- Delayed: ${dashboardData.productionPipeline.delayed}`;

      // Add performance anomalies if any
      if (dashboardData.performanceAnomalies && dashboardData.performanceAnomalies.length > 0) {
        pdfContent += `\n\nPerformance Anomalies:
${dashboardData.performanceAnomalies.map((anomaly: any) => `- ${anomaly.type.toUpperCase()}: ${anomaly.description} (${new Date(anomaly.timestamp).toLocaleDateString()})`).join('\n')}`;
      }

      return new NextResponse(pdfContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="insights-report-${period}.pdf"`
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[GET /api/insights/export]', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}