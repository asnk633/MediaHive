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
import { eq, and, gt, lt, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

// Schema for WAL events
const WalEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  table: z.string(),
  primaryKey: z.record(z.string(), z.union([z.string(), z.number()])),
  data: z.record(z.string(), z.any()).optional(),
  previousData: z.record(z.string(), z.any()).optional(),
});

type WalEvent = z.infer<typeof WalEventSchema>;

// Helper function to convert database row to WAL event
async function rowToWalEvent(
  tableName: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  primaryKey: Record<string, string | number>,
  data?: Record<string, any>,
  previousData?: Record<string, any>
): Promise<WalEvent> {
  return {
    id: `${tableName}-${operation}-${JSON.stringify(primaryKey)}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    operation,
    table: tableName,
    primaryKey,
    ...(data && { data }),
    ...(previousData && { previousData })
  };
}

// Get tables that support replication
const REPLICABLE_TABLES = [
  'tasks', 'events', 'users', 'institutions', 'tenants',
  'taskComments', 'attachments', 'files', 'attendance',
  'presence', 'editLocks', 'taskActivity', 'automationRules',
  'auditLog', 'mediaReports', 'vipEmbeddings', 'notifications'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO timestamp
    const table = searchParams.get('table'); // Specific table to export
    const limit = parseInt(searchParams.get('limit') || '1000');
    
    // Validate table parameter
    if (table && !REPLICABLE_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table. Supported tables: ${REPLICABLE_TABLES.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Build events array
    const events: WalEvent[] = [];
    
    // For simplicity in this implementation, we'll generate synthetic events
    // In a real implementation, you'd track actual database changes
    
    // Get recent audit logs as our WAL events
    const conditions = since 
      ? [gt(auditLog.timestamp, since)]
      : [];
      
    const auditEvents = await db.select()
      .from(auditLog)
      .where(and(...conditions))
      .orderBy(desc(auditLog.timestamp))
      .limit(limit);
    
    // Convert audit logs to WAL events
    for (const audit of auditEvents) {
      const walEvent: WalEvent = {
        id: `audit-${audit.id}`,
        timestamp: audit.timestamp,
        operation: audit.action.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
        table: audit.resourceType,
        primaryKey: { id: audit.resourceId?.toString() || '' },
        data: audit.details ? JSON.parse(JSON.stringify(audit.details)) : undefined
      };
      
      events.push(walEvent);
    }
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Replication export error:', error);
    return NextResponse.json(
      { error: 'Failed to export replication events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different ingestion types
    if (request.headers.get('content-type') === 'application/json') {
      // Single event ingestion
      const result = WalEventSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid WAL event format', details: result.error.flatten() },
          { status: 400 }
        );
      }
      
      const event = result.data;
      await processWalEvent(event);
      
      return NextResponse.json({ success: true });
    } else {
      // Batch ingestion
      const events = Array.isArray(body) ? body : [body];
      
      for (const event of events) {
        const result = WalEventSchema.safeParse(event);
        if (!result.success) {
          return NextResponse.json(
            { error: 'Invalid WAL event format in batch', details: result.error.flatten() },
            { status: 400 }
          );
        }
        
        await processWalEvent(result.data);
      }
      
      return NextResponse.json({ success: true, processed: events.length });
    }
  } catch (error) {
    console.error('Replication ingest error:', error);
    return NextResponse.json(
      { error: 'Failed to ingest replication events' },
      { status: 500 }
    );
  }
}

// Process a single WAL event
async function processWalEvent(event: WalEvent) {
  // In a real implementation, you would apply the event to the database
  // This is a simplified version that just logs the event
  
  console.log(`Processing WAL event: ${event.operation} on ${event.table}`, {
    id: event.id,
    primaryKey: event.primaryKey,
    data: event.data
  });
  
  // Here you would implement the actual database operations:
  // - INSERT: db.insert(schema[event.table]).values(event.data)
  // - UPDATE: db.update(schema[event.table]).set(event.data).where(primaryKeyCondition)
  // - DELETE: db.delete(schema[event.table]).where(primaryKeyCondition)
  
  // For now, we'll just simulate the processing
  await new Promise(resolve => setTimeout(resolve, 10)); // Simulate processing time
}