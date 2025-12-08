// src/app/api/files/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid file id" }, { status: 400 });

    const [fileRecord] = await db.select().from(files).where(eq(files.id, id)).limit(1);

    if (!fileRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If file stored as base64 in fileUrl, return that directly
    if (fileRecord.fileUrl) {
      return NextResponse.json({ downloadUrl: fileRecord.fileUrl }, { status: 200 });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

    // Create a signed URL for 1 hour
    // storagePath is not present on the typed record here; use any to access it safely.
    const { data, error } = await supabase.storage.from("files").createSignedUrl((fileRecord as any).storagePath, 60 * 60);

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