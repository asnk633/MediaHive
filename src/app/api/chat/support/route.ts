import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Find the admin user account
    const { data: adminRes, error: adminErr } = await supabase
      .from('profiles')
      .select('id, role, tenant_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminErr || !adminRes) {
      return NextResponse.json({ error: "No admin account found. Please contact support." }, { status: 404 });
    }

    const adminId = adminRes.id;
    const tenantId = adminRes.tenant_id;

    if (userId === adminId) {
      // Admin trying to contact themselves, maybe return an error or handle gracefully
      return NextResponse.json({ error: "Admin cannot create support chat with themselves." }, { status: 400 });
    }

    // 2. Find existing direct chat
    // Get all rooms for user
    const { data: myRoomsRes } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', userId);

    const myRoomIds = (myRoomsRes || []).map(p => p.room_id);

    if (myRoomIds.length > 0) {
      // Get shared rooms
      const { data: sharedRoomsRes } = await supabase
        .from('chat_participants')
        .select('room_id')
        .in('room_id', myRoomIds)
        .eq('user_id', adminId);

      const sharedRoomIds = (sharedRoomsRes || []).map(p => p.room_id);

      if (sharedRoomIds.length > 0) {
        // Verify exact 2 participants
        const { data: participantCounts } = await supabase
          .from('chat_participants')
          .select('room_id, user_id')
          .in('room_id', sharedRoomIds);

        const roomParticipantMap: Record<string, string[]> = {};
        if (participantCounts) {
          for (const p of participantCounts) {
            if (!roomParticipantMap[p.room_id]) roomParticipantMap[p.room_id] = [];
            roomParticipantMap[p.room_id].push(p.user_id);
          }
        }

        for (const roomId of sharedRoomIds) {
          if (roomParticipantMap[roomId]?.length === 2) {
            return NextResponse.json({ roomId }, { status: 200 });
          }
        }
      }
    }

    // 3. Create a new direct chat
    const roomId = uuidv4();
    const now = new Date().toISOString();

    const { error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        id: roomId,
        name: null, // Private chat
        is_media_team_only: false,
        created_by: userId,
        tenant_id: tenantId,
        created_at: now,
      });

    if (roomError) {
      console.error("Room insert error:", roomError);
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }

    // Get user role for participant entry
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const participants = [
      {
        id: uuidv4(),
        room_id: roomId,
        user_id: userId,
        role: userProfile?.role || 'member',
        tenant_id: tenantId,
        created_at: now,
      },
      {
        id: uuidv4(),
        room_id: roomId,
        user_id: adminId,
        role: adminRes.role,
        added_by: userId,
        tenant_id: tenantId,
        created_at: now,
      }
    ];

    await supabase.from('chat_participants').insert(participants);

    return NextResponse.json({ success: true, roomId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating support chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
