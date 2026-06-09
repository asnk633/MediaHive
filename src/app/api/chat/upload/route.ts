import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, ensureFolderPath, DRIVE_CONFIG, makeFilePublic } from "@/lib/drive";
import { Readable } from "stream";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const roomId = formData.get("roomId") as string | null;

    if (!file || !roomId) {
      return NextResponse.json({ error: "Missing file or roomId" }, { status: 400 });
    }

    const isDriveConfigured = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
                              process.env.GOOGLE_PRIVATE_KEY && 
                              process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!isDriveConfigured) {
      console.log("[ChatUpload] Google Drive not configured. Falling back to Supabase Storage.");
      const arrayBuffer = await file.arrayBuffer();
      const fileBuf = Buffer.from(arrayBuffer);
      const pathKey = `chat/${roomId}/${Date.now()}_${file.name}`;

      const supabaseAdmin = getSupabaseAdmin();
      const { data, error: uploadError } = await supabaseAdmin.storage.from("media").upload(pathKey, fileBuf, {
        contentType: file.type,
        upsert: true,
      });

      if (uploadError) {
        console.error("Supabase failover upload error:", uploadError);
        return NextResponse.json({ 
          error: "Upload failed: " + uploadError.message,
          debugUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage.from("media").getPublicUrl(pathKey);

      return NextResponse.json({
        fileId: data.path,
        url: publicUrl,
        viewUrl: publicUrl,
        name: file.name,
        type: file.type
      }, { status: 201 });
    }

    const driveClient = await getDriveClient();
    const rootFolderId = DRIVE_CONFIG.folderId;
    
    if (!rootFolderId) {
      console.error("GOOGLE_DRIVE_FOLDER_ID is not configured");
      return NextResponse.json({ error: "Server misconfiguration: Drive folder not set" }, { status: 500 });
    }

    // Ensure the chatroom subfolder exists
    const chatFolderId = await ensureFolderPath(driveClient, rootFolderId, ["MediaHive_Chat_Uploads", roomId]);

    // Convert file to stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload to Google Drive
    const driveResponse = await driveClient.files.create({
      requestBody: {
        name: file.name,
        parents: [chatFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    const fileId = driveResponse.data.id;
    if (!fileId) {
      throw new Error("Failed to upload file to Drive");
    }

    // Make the file public so it can be viewed in the app
    await makeFilePublic(driveClient, fileId);

    // The webContentLink is a direct download link, webViewLink is the viewer
    // We prefer a direct link or we can rely on a custom proxy if needed.
    // We will return both for the frontend to decide.
    return NextResponse.json({
      fileId,
      url: driveResponse.data.webContentLink || driveResponse.data.webViewLink,
      viewUrl: driveResponse.data.webViewLink,
      name: file.name,
      type: file.type
    }, { status: 201 });

  } catch (error: any) {
    console.error("Chat file upload error:", error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
