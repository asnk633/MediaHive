import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const { senderId, text } = await req.json();

    if (!senderId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify sender
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.sender_id !== senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ text, is_edited: true })
      .eq('id', messageId);

    if (updateError) throw updateError;

    return NextResponse.json({ message: "Message updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error editing message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch the message sender and participant role
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const isSender = message.sender_id === userId;
    const isManager = role?.toLowerCase() === 'manager' || role?.toLowerCase() === 'creator';

    if (!isSender && !isManager) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true, text: null, media_url: null, drive_file_id: null })
      .eq('id', messageId);

    if (deleteError) throw deleteError;

    // Check if this was the latest message in the room, and update room preview if so
    try {
      const { data: latestMsg } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestMsg && latestMsg.length > 0 && latestMsg[0].id === messageId) {
        await supabase
          .from('chat_rooms')
          .update({ last_message_preview: "Message was deleted" })
          .eq('id', roomId);
      }
    } catch (previewErr) {
      console.error("Error updating room preview on delete:", previewErr);
    }

    return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
