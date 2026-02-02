import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, tasks, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const checks = {
    database: false,
    replication: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connectivity and basic operations
    try {
      const dbCheck = await db.select().from(users).limit(1);
      checks.database = true;
    } catch (error) {
      console.error('Database readiness check failed:', error);
    }

    // Check replication status by verifying we can access audit logs
    try {
      const replicationCheck = await db.select().from(auditLog).limit(1);
      checks.replication = true;
    } catch (error) {
      console.error('Replication readiness check failed:', error);
    }

    // Determine overall status
    const allReady = checks.database && checks.replication;
    const status = allReady ? 'ready' : 'not_ready';

    return NextResponse.json(
      {
        status,
        checks,
      },
      { status: allReady ? 200 : 503 }
    );
  } catch (error) {
    console.error('Readiness check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        checks,
        error: 'Readiness check failed',
      },
      { status: 500 }
    );
  }
}
