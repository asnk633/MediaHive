// src/app/api/upload/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userIdRaw = formData.get("userId") as string | null;

    if (!file || !userIdRaw) {
      return NextResponse.json({ error: "File and userId are required" }, { status: 400 });
    }

    const userId = parseInt(userIdRaw, 10);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be < 5MB" }, { status: 400 });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      // fallback: store base64 in DB (dev)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      await db.update(users).set({ avatarUrl: dataUrl }).where(eq(users.id, userId));
      return NextResponse.json({ avatarUrl: dataUrl, message: "Avatar stored as base64 (dev)" }, { status: 200 });
    }

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const fileBuf = Buffer.from(arrayBuffer);
    const key = `avatars/${userId}/${Date.now()}_${file.name}`;

    const { data, error: uploadError } = await supabase.storage.from("avatars").upload(key, fileBuf, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Supabase avatar upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(data.path);
    const publicUrl = publicData.publicUrl;

    // Persist to DB
    await db.update(users).set({ avatarUrl: publicUrl }).where(eq(users.id, userId));

    return NextResponse.json({ avatarUrl: publicUrl, message: "Avatar uploaded" }, { status: 200 });
  } catch (err) {
    console.error("avatar upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
