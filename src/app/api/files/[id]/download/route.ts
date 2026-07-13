import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/verifyUser";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { getDb } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid file id" }, { status: 400 });

    const db = await getDb();
    const [fileRecord] = await db.select().from(files).where(eq(files.id, id)).limit(1);

    if (!fileRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Cross-tenant Isolation Guard
    const normalizeId = (val: any) => val === null || val === undefined ? '' : String(val);
    if (normalizeId(user.tenant_id) !== normalizeId(fileRecord.tenantId)) {
      return NextResponse.json({ error: "Forbidden: Access denied to this file" }, { status: 403 });
    }

    // If file stored as base64 in fileUrl, return that directly
    if (fileRecord.fileUrl) {
      return NextResponse.json({ downloadUrl: fileRecord.fileUrl }, { status: 200 });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

    // Create a signed URL for 1 hour
    // storagePath is not present on the typed record here; use any to access it safely.
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage.from("files").createSignedUrl((fileRecord as any).storagePath, 60 * 60);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
    }

    if (!data.signedUrl) {
        return NextResponse.json({ error: "Failed to retrieve signed URL" }, { status: 500 });
    }

    return NextResponse.json({ downloadUrl: data.signedUrl }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}