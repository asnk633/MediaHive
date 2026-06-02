import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { newUserId, newUserIds, addedById, tenantId } = body;

    // Normalize to an array of user IDs
    let userIds: string[] = [];
    if (Array.isArray(newUserIds)) {
      userIds = newUserIds;
    } else if (newUserId) {
      userIds = [newUserId];
    }

    if (!roomId || userIds.length === 0 || !addedById || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Verify addedBy, room, and fetch all new users
    const [{ data: newUsers }, { data: addedBy }, { data: room }] = await Promise.all([
      supabase.from('profiles').select('id, role, full_name').in('id', userIds),
      supabase.from('profiles').select('id, full_name').eq('id', addedById).single(),
      supabase.from('chat_rooms').select('id, name').eq('id', roomId).single(),
    ]);

    if (!newUsers || newUsers.length === 0 || !addedBy || !room) {
      return NextResponse.json({ error: "Invalid users, addedBy, or room ID" }, { status: 404 });
    }

    // 2. Check which users are already participants in the chat room
    const { data: existingParticipants } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .in('user_id', userIds);

    const existingUserIds = new Set((existingParticipants || []).map((p: any) => p.user_id));
    const usersToAdd = newUsers.filter((u: any) => !existingUserIds.has(u.id));

    if (usersToAdd.length === 0) {
      return NextResponse.json({ message: "All selected users are already in the chat room" }, { status: 200 });
    }

    const now = new Date().toISOString();

    // 3. Add to chat room in bulk
    const participantRows = usersToAdd.map((user: any) => ({
      id: uuidv4(),
      room_id: roomId,
      user_id: user.id,
      role: user.role,
      added_by: addedById,
      tenant_id: tenantId,
      created_at: now,
    }));

    const { error: insertError } = await supabase.from('chat_participants').insert(participantRows);
    if (insertError) throw insertError;

    // 4. "Notify & Veto" — send notifications to all Managers in this tenant
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'manager');

    if (managers && managers.length > 0) {
      const namesList = usersToAdd.map((u: any) => u.full_name).join(', ');
      const notifs = managers.map((m: any) => ({
        user_id: m.id,
        type: "chat_user_added",
        title: "New Users Added to Chat",
        body: `${namesList} ${usersToAdd.length > 1 ? 'were' : 'was'} added to "${room.name}" by ${addedBy.full_name}. Remove them if this is incorrect.`,
        channel: "ui",
        created_at: now,
      }));
      await supabase.from('notifications').insert(notifs);
    }

    return NextResponse.json({ success: true, message: `${usersToAdd.length} user(s) added and managers notified.` }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding users to chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
