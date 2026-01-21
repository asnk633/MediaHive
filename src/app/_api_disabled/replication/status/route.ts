import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  tasks, 
  events, 
  users, 
  institutions, 
  tenants,
  taskComments,
  attachments,
  files,
  attendance,
  presence,
  editLocks,
  taskActivity,
  automationRules,
  auditLog,
  mediaReports,
  vipEmbeddings,
  notifications
} from '@/db/schema';
import { eq, and, gt, lt, desc, asc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get basic replication status
    const status = {
      timestamp: new Date().toISOString(),
      node: process.env.HOSTNAME || 'unknown',
      status: 'active',
      lastSync: null as string | null,
      pendingEvents: 0,
      tables: [] as { name: string; rowCount: number }[]
    };
    
    // Get approximate row counts for key tables
    try {
      const tableStats = [
        { name: 'tasks', query: () => db.select({ count: count() }).from(tasks) },
        { name: 'events', query: () => db.select({ count: count() }).from(events) },
        { name: 'users', query: () => db.select({ count: count() }).from(users) },
        { name: 'auditLog', query: () => db.select({ count: count() }).from(auditLog) }
      ];
      
      for (const tableStat of tableStats) {
        try {
          const result = await tableStat.query();
          status.tables.push({
            name: tableStat.name,
            rowCount: result[0].count
          });
        } catch (error) {
          console.warn(`Failed to get count for ${tableStat.name}:`, error);
        }
      }
      
      // Get last audit log entry as proxy for last sync
      try {
        const lastAudit = await db.select()
          .from(auditLog)
          .orderBy(desc(auditLog.timestamp))
          .limit(1);
          
        if (lastAudit.length > 0) {
          status.lastSync = lastAudit[0].timestamp;
        }
      } catch (error) {
        console.warn('Failed to get last audit log entry:', error);
      }
    } catch (error) {
      console.warn('Failed to get table statistics:', error);
    }
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Replication status error:', error);
    return NextResponse.json(
      { error: 'Failed to get replication status' },
      { status: 500 }
    );
  }
}
