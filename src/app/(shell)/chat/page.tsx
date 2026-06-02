import { verifyUser } from "@/lib/server/server-utils";
import { getSupabaseAdmin } from "@/lib/verifyUser";
import ChatLayout from "@/components/chat/ChatLayout";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  // Construct request to check session cookies
  const req = new Request('http://localhost/chat');
  const user = await verifyUser(req);
  
  if (!user) {
    redirect('/login');
  }

  const supabase = getSupabaseAdmin();
  const tenantId = user.tenantId || user.tenant_id;

  // Fetch rooms where the user is a participant
  const { data: myParticipants } = await supabase
    .from('chat_participants')
    .select('room_id')
    .eq('user_id', user.uid);

  const roomIds = (myParticipants || []).map((p: any) => p.room_id);
  
  let rooms: any[] = [];
  if (roomIds.length > 0) {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', roomIds)
      .order('created_at', { ascending: false });
    rooms = data || [];

    // Fetch the latest message for each room to prepend the sender name dynamically
    for (const room of rooms) {
      const { data: lastMsgData } = await supabase
        .from('chat_messages')
        .select('sender_id, text, media_type, created_at, profiles(full_name)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (lastMsgData) {
        let prefix = '';
        const isGroup = room.is_media_team_only || (room.name && room.name.trim().length > 0);
        
        if (isGroup) {
          if (lastMsgData.sender_id === user.uid) {
            prefix = 'You: ';
          } else {
            const profilesObj = lastMsgData.profiles as any;
            const senderName = (Array.isArray(profilesObj) ? profilesObj[0]?.full_name : profilesObj?.full_name)?.split(' ')[0];
            if (senderName) {
              prefix = `${senderName}: `;
            }
          }
        }

        let previewText = room.last_message_preview || '';
        
        // Reconstruct preview string dynamically based on the latest message just in case DB is null
        const msgText = lastMsgData.text || '';
        const mediaType = lastMsgData.media_type;
        
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

        // Apply prefix
        if (!previewText.startsWith('You:') && !previewText.includes(': ')) {
          room.lastMessagePreview = `${prefix}${previewText}`;
        } else {
          room.lastMessagePreview = previewText;
        }
      }
    }
  }

  // Get all users in the tenant for the Add User modal
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, email, avatar_url, avatar_drive_id')
    .eq('tenant_id', tenantId);

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('avatar_url, avatar_drive_id')
    .eq('id', user.uid)
    .single();

  const currentUser = {
    id: user.uid,
    uid: user.uid,
    fullName: user.name || user.email || 'User',
    role: user.role,
    tenantId,
    avatarUrl: currentProfile?.avatar_url || null,
    avatarDriveId: currentProfile?.avatar_drive_id || null,
  };

  return (
    <div className="w-full h-[calc(100vh-10rem)] min-h-[500px] flex relative z-10">
      <ChatLayout currentUser={currentUser} initialRooms={rooms} allUsers={allUsers || []} />
    </div>
  );
}
