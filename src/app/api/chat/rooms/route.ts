import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/verifyUser";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const lastReadParam = searchParams.get('lastRead');
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch rooms where the user is a participant
    const { data: myParticipants, error: partError } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', userId);

    if (partError) throw partError;

    const roomIds = (myParticipants || []).map((p: any) => p.room_id);
    
    let rooms: any[] = [];
    let lastReadMap: Record<string, string> = {};
    
    if (lastReadParam) {
      try {
        lastReadMap = JSON.parse(decodeURIComponent(lastReadParam));
      } catch (e) {
        console.error("Failed to parse lastRead parameter:", e);
      }
    }

    if (roomIds.length > 0) {
      const { data, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('last_message_time', { ascending: false, nullsFirst: false });


      if (roomsError) throw roomsError;
      rooms = data || [];

      // Fetch the latest message and unread count for each room
      for (const room of rooms) {
        // Fetch latest message details
        const { data: lastMsgData } = await supabase
          .from('chat_messages')
          .select('sender_id, text, media_type, created_at, profiles(full_name)')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastMsg = lastMsgData && lastMsgData.length > 0 ? lastMsgData[0] : null;
        
        if (lastMsg) {
          let prefix = '';
          const isGroup = room.is_media_team_only || (room.name && room.name.trim().length > 0);
          
          if (isGroup) {
            if (lastMsg.sender_id === userId) {
              prefix = 'You: ';
            } else {
              const profilesObj = lastMsg.profiles as any;
              const senderName = (Array.isArray(profilesObj) ? profilesObj[0]?.full_name : profilesObj?.full_name)?.split(' ')[0];
              if (senderName) {
                prefix = `${senderName}: `;
              }
            }
          }

          let previewText = room.last_message_preview || '';
          const msgText = lastMsg.text || '';
          const mediaType = lastMsg.media_type;
          
          if (mediaType === 'audio' || mediaType === 'voice') {
            const seconds = parseInt(msgText.trim(), 10);
            if (!isNaN(seconds)) {
              const minutes = Math.floor(seconds / 60).toString();
              const secs = (seconds % 60).toString().padStart(2, '0');
              previewText = `Voice note (${minutes}:${secs})`;
            } else if (msgText.includes('Voice note')) {
              previewText = msgText;
            } else if (msgText) {
              previewText = msgText;
            } else {
              previewText = 'Voice note';
            }
          } else if (msgText.trim()) {
            previewText = msgText;
          } else if (mediaType && mediaType !== 'text') {
            previewText = `Sent a ${mediaType}`;
          } else if (!previewText) {
            previewText = 'Attachment';
          }

          if (!previewText.startsWith('You:') && !previewText.includes(': ')) {
            room.lastMessagePreview = `${prefix}${previewText}`;
            room.last_message_preview = `${prefix}${previewText}`;
          } else {
            room.lastMessagePreview = previewText;
            room.last_message_preview = previewText;
          }
          
          // Also set the correct dynamic last message time from actual message
          room.lastMessageTime = lastMsg.created_at;
          room.last_message_time = lastMsg.created_at;
        }

        // Calculate unread count
        const lastReadTime = lastReadMap[room.id];
        if (lastReadTime) {
          const { count, error: countError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', lastReadTime)
            .neq('sender_id', userId);
            
          if (!countError) {
            room.unreadCount = count || 0;
          } else {
            room.unreadCount = 0;
          }
        } else {
          // If no last read timestamp exists for this room, count all messages sent by others
          const { count, error: countError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', userId);

          if (!countError) {
            room.unreadCount = count || 0;
          } else {
            room.unreadCount = 0;
          }
        }
      }
    }

    return NextResponse.json(rooms, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching chat rooms with unreads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const { name, isMediaTeamOnly, creatorId, tenantId, participantUserIds } = await req.json();

    if (!name || !creatorId || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify creator exists
    const { data: creator } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', creatorId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const roomId = uuidv4();
    const now = new Date().toISOString();

    // 1. Create the Chat Room
    const { error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        id: roomId,
        name,
        is_media_team_only: isMediaTeamOnly || false,
        created_by: creatorId,
        tenant_id: tenantId,
        created_at: now,
      });

    if (roomError) {
      console.error("Room insert error:", roomError);
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }

    // Fetch all Media & IT team members (roles: 'manager', 'team') in the tenant to add as default participants
    const { data: mediaTeam } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('tenant_id', tenantId)
      .in('role', ['manager', 'team']);

    const participantsToInsert: any[] = [{
      id: uuidv4(),
      room_id: roomId,
      user_id: creatorId,
      role: creator.role,
      tenant_id: tenantId,
      created_at: now,
    }];

    const insertedUserIds = new Set([creatorId]);

    // Add all media team members by default
    if (mediaTeam) {
      for (const member of mediaTeam) {
        if (insertedUserIds.has(member.id)) continue;
        insertedUserIds.add(member.id);
        participantsToInsert.push({
          id: uuidv4(),
          room_id: roomId,
          user_id: member.id,
          role: member.role,
          tenant_id: tenantId,
          created_at: now,
        });
      }
    }

    if (participantUserIds && Array.isArray(participantUserIds)) {
      for (const userId of participantUserIds) {
        if (insertedUserIds.has(userId)) continue;
        const { data: u } = await supabase.from('profiles').select('id, role').eq('id', userId).single();
        if (u) {
          insertedUserIds.add(userId);
          participantsToInsert.push({
            id: uuidv4(),
            room_id: roomId,
            user_id: userId,
            role: u.role,
            added_by: creatorId,
            tenant_id: tenantId,
            created_at: now,
          });
        }
      }
    }

    await supabase.from('chat_participants').insert(participantsToInsert);

    return NextResponse.json({ success: true, roomId, name }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating chat room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
