// src/app/api/upload/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseFromRequest, verifyUser } from "@/lib/verifyUser";
import { getDb } from "@/db";
import { files, users, userInstitutions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// small helper: avoid depending on a missing export in utils during local dev
function isBase64DataUrl(s: string | null | undefined) {
  if (!s || typeof s !== "string") return false;
  return /^data:[\w/+.-]+;base64,/.test(s);
}


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadedByIdRaw = formData.get("uploadedById");
    const institutionIdRaw = formData.get("institution_id") as string | null;
    const folder = (formData.get("folder") as string | null) || null;
    const visibility = (formData.get("visibility") as string | null) || "all";

    if (!file || !uploadedByIdRaw || !institutionIdRaw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uploadedById = uploadedByIdRaw;
    const institution_id = institutionIdRaw;

    const database = await getDb();
    const [uploaderRecord] = await database.select().from(users).where(eq(users.id, parseInt(String(uploadedById), 10))).limit(1);
    if (!uploaderRecord) {
      return NextResponse.json({ error: "Uploader user not found" }, { status: 404 });
    }

    const normalizeId = (val: any) => val === null || val === undefined ? '' : String(val);
    if (user.role !== 'admin' && normalizeId(user.email) !== normalizeId(uploaderRecord.email)) {
      return NextResponse.json({ error: "Forbidden: Cannot upload files on behalf of another user" }, { status: 403 });
    }
    if (normalizeId(user.tenant_id) !== normalizeId(uploaderRecord.tenantId)) {
      return NextResponse.json({ error: "Forbidden: Tenant mismatch" }, { status: 403 });
    }

    const userInstRecords = await database.select().from(userInstitutions).where(
      and(
        eq(userInstitutions.userId, parseInt(String(uploadedById), 10)),
        eq(userInstitutions.institution_id, parseInt(String(institution_id), 10))
      )
    ).limit(1);

    if (userInstRecords.length === 0) {
      return NextResponse.json({ error: 'Unauthorized: User is not associated with this institution' }, { status: 403 });
    }

    // --- Dev/Local Fallback: Store small files as Base64 ---
    // If Supabase not configured, fallback to base64 (dev) for small files
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      const arrayBuffer = await file.arrayBuffer();
      // Simple size check (e.g., limit to 1MB for base64 to avoid massive DB rows)
      if (arrayBuffer.byteLength > 1024 * 1024) {
        return NextResponse.json({ error: "File too large for local storage fallback" }, { status: 413 });
      }

      const fileBuf = Buffer.from(arrayBuffer);
      const dataUrl = `data:${file.type};base64,${fileBuf.toString("base64")}`;

      const inserted = await database.insert(files).values({
        name: file.name,
        fileUrl: dataUrl,
        fileType: file.type,
        fileSize: file.size,
        folder,
        visibility,
        uploadedById,
        institution_id,
        created_at: new Date().toISOString(),
      } as any).returning();

      return NextResponse.json(inserted[0], { status: 201 });
    }

    // --- Production/Supabase Upload ---
    const arrayBuffer = await file.arrayBuffer();
    const fileBuf = Buffer.from(arrayBuffer);
    const pathKey = `files/${institution_id}/${Date.now()}_${file.name}`;

    const supabase = await getSupabaseFromRequest(request);
    const { data, error: uploadError } = await supabase.storage.from("files").upload(pathKey, fileBuf, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Supabase file upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Save DB record with storage path
    const inserted = await database.insert(files).values({
      name: file.name,
      fileUrl: null, // Will be generated on GET request if needed
      fileType: file.type,
      fileSize: file.size,
      folder,
      visibility,
      uploadedById,
      institution_id,
      storagePath: data.path,
      created_at: new Date().toISOString(),
    } as any).returning();

    return NextResponse.json(inserted[0], { status: 201 });

  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: 'Internal server error: ' + ((error as Error)?.message ?? String(error)) },
      { status: 500 }
    );
  }
}
