// src/app/api/upload/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/db";
import { files } from "@/db/schema";
// small helper: avoid depending on a missing export in utils during local dev
function isBase64DataUrl(s: string | null | undefined) {
  if (!s || typeof s !== "string") return false;
  return /^data:[\w/+.-]+;base64,/.test(s);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadedByIdRaw = formData.get("uploadedById") as string | null;
    const institutionIdRaw = formData.get("institutionId") as string | null;
    const folder = (formData.get("folder") as string | null) || null;
    const visibility = (formData.get("visibility") as string | null) || "all";

    if (!file || !uploadedByIdRaw || !institutionIdRaw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const uploadedById = parseInt(uploadedByIdRaw, 10);
    const institutionId = parseInt(institutionIdRaw, 10);

    if (Number.isNaN(uploadedById) || Number.isNaN(institutionId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
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

      const inserted = await db.insert(files).values({
        name: file.name,
        fileUrl: dataUrl,
        fileType: file.type,
        fileSize: file.size,
        folder,
        visibility,
        uploadedById,
        institutionId,
        createdAt: new Date().toISOString(),
      } as any).returning();

      return NextResponse.json(inserted[0], { status: 201 });
    }

    // --- Production/Supabase Upload ---
    const arrayBuffer = await file.arrayBuffer();
    const fileBuf = Buffer.from(arrayBuffer);
    const pathKey = `files/${institutionId}/${Date.now()}_${file.name}`;

    const { data, error: uploadError } = await supabase.storage.from("files").upload(pathKey, fileBuf, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Supabase file upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Save DB record with storage path
    const inserted = await db.insert(files).values({
      name: file.name,
      fileUrl: null, // Will be generated on GET request if needed
      fileType: file.type,
      fileSize: file.size,
      folder,
      visibility,
      uploadedById,
      institutionId,
      storagePath: data.path,
      createdAt: new Date().toISOString(),
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