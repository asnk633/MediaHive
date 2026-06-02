import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    if (!roomId) {
      return NextResponse.json({ error: "Missing room ID" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chat_participants')
      .select('user_id, role, profiles!chat_participants_user_id_fkey(id, full_name, role, email, avatar_url, avatar_drive_id)')
      .eq('room_id', roomId);

    if (error) {
      throw error;
    }

    const participants = (data || []).map((p: any) => ({
      id: p.user_id,
      fullName: p.profiles?.full_name || 'Guest User',
      email: p.profiles?.email || '',
      role: p.profiles?.role || 'member',
      participantRole: p.role,
      avatarUrl: p.profiles?.avatar_url || null,
      avatarDriveId: p.profiles?.avatar_drive_id || null,
    }));

    return NextResponse.json(participants, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching chat participants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
