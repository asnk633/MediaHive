import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Reverse to display chronologically (oldest first, newest last) for the UI message list
    const chronologicalMessages = messages ? [...messages].reverse() : [];

    return NextResponse.json(chronologicalMessages, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const { senderId, text, mediaUrl, mediaType, driveFileId, tenantId } = await req.json();

    if (!senderId || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const newMessageId = uuidv4();
    const now = new Date().toISOString();

    const newMessage = {
      id: newMessageId,
      room_id: roomId,
      sender_id: senderId,
      text: text || null,
      media_url: mediaUrl || null,
      media_type: mediaType || 'text',
      drive_file_id: driveFileId || null,
      tenant_id: tenantId,
      created_at: now,
    };

    const { error } = await supabase.from('chat_messages').insert(newMessage);
    if (error) throw error;

    // Update the room's last message preview and time
    let preview = text || '';
    if (mediaType === 'voice' || mediaType === 'audio') {
      const seconds = parseInt(text || '', 10);
      if (!isNaN(seconds)) {
        const minutes = Math.floor(seconds / 60).toString();
        const secs = (seconds % 60).toString().padStart(2, '0');
        preview = `Voice note (${minutes}:${secs})`;
      } else {
        preview = 'Voice note';
      }
    } else if (!preview && mediaType && mediaType !== 'text') {
      preview = `Sent a ${mediaType}`;
    } else if (!preview) {
      preview = 'Attachment';
    }

    await supabase.from('chat_rooms').update({
      last_message_preview: preview,
      last_message_time: now
    }).eq('id', roomId);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
