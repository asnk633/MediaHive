// src/app/api/health/schema/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from '@/db';
import { users, tenants, events, notifications } from '@/db/schema';

type HealthResult = {
  ok: boolean;
  checks?: {
    dbConnect?: { ok: boolean; detail?: string };
    tables?: { ok: boolean; found: string[]; missing: string[] };
  };
  error?: string;
};

const REQUIRED_TABLES = ["users", "tenants", "events", "notifications"];

export async function GET(_req: NextRequest) {
  try {
    // Try a lightweight connectivity check
    let dbConnectOk = false;
    let connectDetail = "";
    try {
      // For drizzle, we can try a simple query
      await db.select().from(users).limit(1);
      dbConnectOk = true;
    } catch (err: any) {
      dbConnectOk = false;
      connectDetail = (err && err.message) || String(err);
    }

    // Schema check: check if required tables exist by trying to query them
    let foundTables: string[] = [];
    try {
      // Check each required table by attempting a simple select query
      const tableChecks = [
        { name: "users", check: () => db.select().from(users).limit(1) },
        { name: "tenants", check: () => db.select().from(tenants).limit(1) },
        { name: "events", check: () => db.select().from(events).limit(1) },
        { name: "notifications", check: () => db.select().from(notifications).limit(1) },
      ];

      for (const { name, check } of tableChecks) {
        try {
          await check();
          foundTables.push(name);
        } catch (err) {
          // Table doesn't exist or other error, continue checking others
          console.debug(`Table ${name} check failed:`, err);
        }
      }
    } catch (err: any) {
      // ignore schema-read error but include debug in response
      return NextResponse.json({
        ok: false,
        checks: {
          dbConnect: { ok: dbConnectOk, detail: connectDetail },
        },
        error: "Failed to read DB schema: " + (err?.message ?? String(err)),
      }, { status: 500 });
    }

    const missing = REQUIRED_TABLES.filter((t) => !foundTables.includes(t));
    const ok = dbConnectOk && missing.length === 0;

    return NextResponse.json({
      ok,
      checks: {
        dbConnect: { ok: dbConnectOk, detail: connectDetail || undefined },
        tables: { ok: missing.length === 0, found: foundTables, missing },
      },
    }, { status: ok ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: (err && err.message) || String(err),
    }, { status: 500 });
  }
}
