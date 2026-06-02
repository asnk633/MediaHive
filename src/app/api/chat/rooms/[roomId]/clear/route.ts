import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing user identity parameter" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify user role on the database
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const isAuthorized = userProfile.role === 'admin' || userProfile.role === 'manager';
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Only Managers and Admins can clear chat history" }, { status: 403 });
    }

    // Hard-delete all messages from chat_messages for the room
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('room_id', roomId);

    if (deleteError) {
      console.error("Error clearing chat messages:", deleteError);
      return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
    }

    // Update room's last message preview and time to reflect cleared state
    const { error: roomError } = await supabase
      .from('chat_rooms')
      .update({
        last_message_preview: "Chat was cleared",
        last_message_time: new Date().toISOString()
      })
      .eq('id', roomId);

    if (roomError) {
      console.error("Error updating room preview:", roomError);
      // Non-fatal error as messages were already hard-deleted successfully
    }

    return NextResponse.json({ success: true, message: "Chat history cleared successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Error in DELETE clear chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
