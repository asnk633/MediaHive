/* src/app/api/tasks/review/route.ts
   Robust route: get params from query, validate canonical values, try Drizzle update,
   fallback to raw parameterized SQL if driver produces invalid SQL in dev.
*/
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db"; // adjust import if your DB export lives elsewhere
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { hasRole } from "@/app/api/_lib/auth";

// Configure for static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

export async function PATCH(req: NextRequest) {
  try {
    // Authorize user with RBAC - only roles with review:tasks permission can update review status
    const user = await authorizeByPermission(req, 'edit:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only authorized users can review tasks' }, { status: 403 });
    }

    const db = await getDb();

    // Get task ID from query parameters
    const { searchParams } = new URL(req.url);
    const idString = searchParams.get('id');
    const id = Number(idString);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const reviewStatus = String(body?.reviewStatus ?? "").toLowerCase();
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(reviewStatus)) {
      return NextResponse.json({ error: "Invalid reviewStatus", allowed }, { status: 400 });
    }

    // Preferred: use Drizzle update with correct column name
    try {
      await db.update(tasks).set({ reviewStatus: reviewStatus as any }).where(eq(tasks.id, id));
      return NextResponse.json({ ok: true });
    } catch (drizzleErr) {
      console.warn("Drizzle update failed, falling back to raw SQL update", drizzleErr);
      // Raw SQL fallback (parameterized)
      try {
        const sql = 'UPDATE "tasks" SET "reviewStatus" = ? WHERE "id" = ?';
        // adapt to your driver: try run -> prepare/run -> query
        if (typeof (db as any).run === "function") {
          await (db as any).run(sql, [reviewStatus, id]);
        } else if (typeof (db as any).prepare === "function") {
          await (db as any).prepare(sql).run([reviewStatus, id]);
        } else if (typeof (db as any).query === "function") {
          await (db as any).query(sql, [reviewStatus, id]);
        } else {
          throw new Error("No supported DB query method found on db object");
        }
        return NextResponse.json({ ok: true, fallback: true });
      } catch (rawErr) {
        console.error("Raw SQL fallback update failed", rawErr);
        return NextResponse.json({ error: "Failed query", message: String(rawErr) }, { status: 500 });
      }
    }
  } catch (err) {
    console.error("PATCH /api/tasks/review unexpected error:", err);
    return NextResponse.json({ error: "Failed to update reviewStatus", message: String(err) }, { status: 500 });
  }
}