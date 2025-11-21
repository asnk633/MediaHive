// src/app/api/insights/dashboard/route.ts
// Insights Dashboard API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '../../_lib/rbac';
import { db } from '@/db';
import { tasks, events, institutions, users, files } from '@/db/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';

// Helper function to get date range based on period
function getDateRange(period: string) {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }
  
  return { startDate: startDate.toISOString(), endDate: now.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week';
    const tenantId = searchParams.get('tenant') || 'all';

    // Get date range
    const { startDate, endDate } = getDateRange(period);

    // Build tenant condition
    const tenantCondition = tenantId !== 'all' ? eq(tasks.tenantId, parseInt(tenantId)) : undefined;

    // 1. Task Workload by Institution
    const taskWorkloadQuery = db
      .select({
        institutionId: institutions.id,
        institutionName: institutions.name,
        taskCount: count(tasks.id)
      })
      .from(tasks)
      .innerJoin(institutions, eq(tasks.institutionId, institutions.id))
      .where(and(
        tenantCondition ? eq(tasks.tenantId, parseInt(tenantId)) : undefined,
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ))
      .groupBy(institutions.id, institutions.name);

    const taskWorkloadResult = await taskWorkloadQuery;
    const taskWorkload = taskWorkloadResult.map((item: any) => ({
      institution: item.institutionName,
      workload: item.taskCount,
      trend: item.taskCount > 10 ? 'up' : item.taskCount > 5 ? 'stable' : 'down'
    }));

    // 2. TAT Metrics (Turnaround Time)
    const tatQuery = db
      .select({
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt
      })
      .from(tasks)
      .where(and(
        tenantCondition ? eq(tasks.tenantId, parseInt(tenantId)) : undefined,
        eq(tasks.status, 'done'),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ));

    const tatResult = await tatQuery;
    const tatDurations = tatResult.map((task: any) => {
      const created = new Date(task.createdAt);
      const updated = new Date(task.updatedAt);
      return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // in days
    });

    const averageTat = tatDurations.length > 0 
      ? (tatDurations.reduce((a, b) => a + b, 0) / tatDurations.length).toFixed(1) 
      : '0';
      
    const medianTat = tatDurations.length > 0 
      ? tatDurations.sort((a, b) => a - b)[Math.floor(tatDurations.length / 2)].toFixed(1) 
      : '0';

    const tatMetrics = {
      average: `${averageTat} days`,
      median: `${medianTat} days`,
      trend: parseFloat(averageTat) < 3 ? 'improving' : parseFloat(averageTat) > 5 ? 'declining' : 'stable'
    };

    // 3. SLA Compliance
    // For this example, let's assume SLA is 48 hours for task completion
    const slaCompliantTasks = tatDurations.filter(duration => duration <= 2).length;
    const totalCompletedTasks = tatDurations.length;
    
    const compliantPercentage = totalCompletedTasks > 0 
      ? Math.round((slaCompliantTasks / totalCompletedTasks) * 100) 
      : 0;
      
    const nonCompliantPercentage = 100 - compliantPercentage;

    const slaCompliance = {
      compliant: compliantPercentage,
      nonCompliant: nonCompliantPercentage,
      trend: compliantPercentage > 80 ? 'improving' : compliantPercentage < 70 ? 'declining' : 'stable'
    };

    // 4. Event Frequency
    const eventQuery = db
      .select({
        startTime: events.startTime
      })
      .from(events)
      .where(and(
        tenantCondition ? eq(events.tenantId, parseInt(tenantId)) : undefined,
        gte(events.startTime, startDate),
        lte(events.startTime, endDate)
      ));

    const eventResult = await eventQuery;
    
    // Group events by day of week
    const eventFrequency: { day: string; count: number }[] = [
      { day: 'Sun', count: 0 },
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 }
    ];
    
    eventResult.forEach((event: any) => {
      const dayIndex = new Date(event.startTime).getDay();
      eventFrequency[dayIndex].count++;
    });

    // 5. Media Output (files uploaded)
    const mediaQuery = db
      .select({
        createdAt: files.createdAt
      })
      .from(files)
      .where(and(
        tenantCondition ? eq(files.tenantId, parseInt(tenantId)) : undefined,
        gte(files.createdAt, startDate),
        lte(files.createdAt, endDate)
      ));

    const mediaResult = await mediaQuery;
    
    // Group media by month for the last 6 months
    const mediaOutput = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      
      const monthCount = mediaResult.filter((file: any) => {
        const fileDate = new Date(file.createdAt);
        return fileDate.getMonth() === monthDate.getMonth() && 
               fileDate.getFullYear() === monthDate.getFullYear();
      }).length;
      
      mediaOutput.push({
        month: monthName,
        count: monthCount
      });
    }

    // 6. Team Activity Ranking
    // For simplicity, we'll group by institution as a proxy for teams
    const teamActivity = taskWorkload.map((item: any) => ({
      team: item.institution,
      activity: Math.min(100, item.workload * 3) // Scale to 0-100
    }));

    // 7. Production Pipeline
    const pipelineQuery = db
      .select({
        status: tasks.status,
        count: count(tasks.id)
      })
      .from(tasks)
      .where(tenantCondition ? eq(tasks.tenantId, parseInt(tenantId)) : undefined)
      .groupBy(tasks.status);

    const pipelineResult = await pipelineQuery;
    
    const statusCounts: Record<string, number> = {};
    pipelineResult.forEach((item: any) => {
      statusCounts[item.status] = item.count;
    });

    const productionPipeline = {
      inProgress: statusCounts['in_progress'] || 0,
      pendingReview: statusCounts['review'] || 0,
      completed: statusCounts['done'] || 0,
      delayed: Math.max(0, (statusCounts['todo'] || 0) - 5) // Assume delayed if more than 5 todo
    };

    // 8. Performance Anomalies
    const performanceAnomalies = [];
    
    // Check for spike in urgent tasks
    const urgentTasksQuery = db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(and(
        tenantCondition ? eq(tasks.tenantId, parseInt(tenantId)) : undefined,
        eq(tasks.priority, 'urgent'),
        gte(tasks.createdAt, startDate),
        lte(tasks.createdAt, endDate)
      ));

    const urgentTasksResult = await urgentTasksQuery;
    const urgentTaskCount = urgentTasksResult[0]?.count || 0;
    
    if (urgentTaskCount > 10) {
      performanceAnomalies.push({
        id: 1,
        type: 'spike',
        description: `Spike in urgent tasks (${urgentTaskCount} this period)`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

    // Check for delayed tasks
    const delayedTasksQuery = db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(and(
        tenantCondition ? eq(tasks.tenantId, parseInt(tenantId)) : undefined,
        eq(tasks.status, 'todo'),
        lte(tasks.dueDate, new Date().toISOString())
      ));

    const delayedTasksResult = await delayedTasksQuery;
    const delayedTaskCount = delayedTasksResult[0]?.count || 0;
    
    if (delayedTaskCount > 5) {
      performanceAnomalies.push({
        id: 2,
        type: 'delay',
        description: `${delayedTaskCount} tasks past due date`,
        severity: delayedTaskCount > 10 ? 'high' : 'medium',
        timestamp: new Date().toISOString()
      });
    }

    // Return dashboard data
    const dashboardData = {
      taskWorkload,
      tatMetrics,
      slaCompliance,
      eventFrequency,
      mediaOutput,
      teamActivity,
      productionPipeline,
      performanceAnomalies
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('[GET /api/insights/dashboard]', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}