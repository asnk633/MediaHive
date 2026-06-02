import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

// PATCH: Edit Room Name / Icon
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { name, iconUrl } = body;

    const supabase = getSupabaseAdmin();
    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Room name cannot be empty" }, { status: 400 });
      }
      updates.name = name;
    }

    if (iconUrl !== undefined) {
      updates.icon_url = iconUrl;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
    }

    const { data: updatedRoom, error } = await supabase
      .from('chat_rooms')
      .update(updates)
      .eq('id', roomId)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating room:", error);
      return NextResponse.json({ error: "Failed to update room metadata" }, { status: 500 });
    }

    return NextResponse.json({ success: true, room: updatedRoom }, { status: 200 });
  } catch (error: any) {
    console.error("Error patching chat room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete Chat Room (Manager/Admin Only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing user identity parameter" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify user role
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
      return NextResponse.json({ error: "Unauthorized: Only Managers and Admins can delete rooms" }, { status: 403 });
    }

    // Delete participants & messages will cascades automatically due to Supabase foreign keys,
    // but performing clean explicit deletes is safer
    await Promise.all([
      supabase.from('chat_participants').delete().eq('room_id', roomId),
      supabase.from('chat_messages').delete().eq('room_id', roomId),
    ]);

    // Finally delete the room itself
    const { error: deleteError } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (deleteError) {
      console.error("Error deleting room:", deleteError);
      return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Room and associated data deleted successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting chat room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
