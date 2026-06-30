'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import GroupInfoSidebar from './GroupInfoSidebar';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setLastReadTimestamp, getLastReadTimestamps } from '@/lib/chatUnreadTracker';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ChatLayout({ currentUser, initialRooms, allUsers }: { currentUser: any, initialRooms: any[], allUsers: any[] }) {
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get('room');
  const [rooms, setRooms] = useState<any[]>(initialRooms);
  const initialActiveRoom = defaultRoomId ? (initialRooms.find(r => r.id === defaultRoomId) || { id: defaultRoomId, name: null }) : null;
  const [activeRoom, setActiveRoom] = useState<any | null>(initialActiveRoom);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeRoomMessages, setActiveRoomMessages] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const tabParam = searchParams ? searchParams.get('tab') : null;

  const filteredRoomsByTab = useMemo(() => {
    return (rooms || []).filter((room) => {
      if (!room) return false;
      const isGroup = !!(room.is_media_team_only || (room.name && room.name.trim().length > 0));
      return tabParam === "channels" ? isGroup : !isGroup;
    });
  }, [rooms, tabParam]);

  // Mark active room as read
  useEffect(() => {
    if (activeRoom && currentUser?.id) {
      setLastReadTimestamp(currentUser.id, activeRoom.id);
      setUnreadCounts(prev => ({ ...prev, [activeRoom.id]: 0 }));
    }
  }, [activeRoom?.id, currentUser?.id]);

  // Sync activeRoom with defaultRoomId when URL changes
  useEffect(() => {
    if (defaultRoomId && defaultRoomId !== activeRoom?.id) {
      const room = rooms.find(r => r.id === defaultRoomId) || { id: defaultRoomId, name: null };
      setActiveRoom(room);
      setActiveRoomMessages([]);
    }
  }, [defaultRoomId]);

  // Global exclusive media playback listener (pauses other audio/video elements on any play event)
  useEffect(() => {
    const handleGlobalPlay = (event: Event) => {
      const playingElement = event.target as HTMLMediaElement;
      if (!playingElement) return;
      
      const allMediaElements = document.querySelectorAll('audio, video');
      allMediaElements.forEach((el) => {
        const media = el as HTMLMediaElement;
        if (media !== playingElement && !media.paused) {
          try {
            media.pause();
          } catch (e) {
            console.error('Failed to pause background media:', e);
          }
        }
      });
    };

    window.addEventListener('play', handleGlobalPlay, true);
    return () => {
      window.removeEventListener('play', handleGlobalPlay, true);
    };
  }, []);

  // Poll chat rooms and unreads directly via client-side Supabase query
  const pollRooms = async () => {
    if (!currentUser?.id) return;
    try {
      const lastReadMap = getLastReadTimestamps(currentUser.id);
      
      // 1. Fetch rooms where the user is a participant
      const { data: myParticipants, error: partError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', currentUser.id);

      if (partError) throw partError;

      const roomIds = (myParticipants || []).map((p: any) => p.room_id);
      
      if (roomIds.length === 0) {
        setRooms([]);
        setUnreadCounts({});
        return;
      }

      // 2. Fetch room details
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (roomsError) throw roomsError;
      
      const roomsList = roomsData || [];

      // 3. For each room, fetch latest message details and calculate unread counts
      for (const room of roomsList) {
        const { data: lastMsgData } = await supabase
          .from('chat_messages')
          .select('sender_id, text, media_type, created_at')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastMsg = lastMsgData && lastMsgData.length > 0 ? lastMsgData[0] : null;
        
        if (lastMsg) {
          let prefix = '';
          const isGroup = room.is_media_team_only || (room.name && room.name.trim().length > 0);
          
          if (isGroup) {
            if (lastMsg.sender_id === currentUser.id) {
              prefix = 'You: ';
            } else {
              const sender = allUsers.find((u: any) => u.id === lastMsg.sender_id);
              const senderName = sender?.full_name?.split(' ')[0];
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
          
          room.lastMessageTime = lastMsg.created_at;
          room.last_message_time = lastMsg.created_at;
        }

        // Calculate unread count client-side
        const lastReadTime = lastReadMap[room.id];
        if (lastReadTime) {
          const { count, error: countError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', lastReadTime)
            .neq('sender_id', currentUser.id);
            
          if (!countError) {
            room.unreadCount = count || 0;
          } else {
            room.unreadCount = 0;
          }
        } else {
          const { count, error: countError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', currentUser.id);

          if (!countError) {
            room.unreadCount = count || 0;
          } else {
            room.unreadCount = 0;
          }
        }
      }

      setRooms(roomsList);
      
      const counts: Record<string, number> = {};
      roomsList.forEach((r: any) => {
        counts[r.id] = activeRoom?.id === r.id ? 0 : (r.unreadCount || 0);
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error("Error polling rooms in ChatLayout:", err);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    pollRooms();

    // Setup realtime subscription to listen for updates in rooms list
    const roomChannel = supabase
      .channel('public_chat_rooms_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => {
          pollRooms();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${currentUser.id}` },
        () => {
          pollRooms();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          // Trigger rooms poll to update last message previews and unread counts immediately on new message inserts
          pollRooms();

          if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || 'isTauri' in window)) {
            const newMsg = payload.new;
            if (newMsg && newMsg.sender_id !== currentUser.id) {
              import('@tauri-apps/api/window').then(async (windowModule) => {
                const appWindow = windowModule.getCurrentWindow();
                const isVisible = await appWindow.isVisible();
                const isMinimized = await appWindow.isMinimized();
                
                // Only send OS notification if app is hidden or minimized
                if (!isVisible || isMinimized) {
                  const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
                  let permissionGranted = await isPermissionGranted();
                  if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                  }
                  if (permissionGranted) {
                    sendNotification({
                      title: 'New Message',
                      body: newMsg.text_content || 'You received a new message in MediaHive.',
                    });
                  }
                }
              }).catch(console.error);
            }
          }
        }
      )
      .subscribe();

    const interval = setInterval(pollRooms, 8000);
    return () => {
      supabase.removeChannel(roomChannel);
      clearInterval(interval);
    };
  }, [currentUser?.id, activeRoom?.id, allUsers]);

  const handleSelectRoom = (room: any) => {
    setActiveRoom(room);
    setActiveRoomMessages([]);
  };

  const handleRoomCreated = (newRoom: any) => {
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom);
  };

  const handleRoomUpdated = (updatedRoom: any) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r));
    if (activeRoom?.id === updatedRoom.id) {
      setActiveRoom((prev: any) => ({ ...prev, ...updatedRoom }));
    }
  };

  const handleRoomDeleted = (deletedRoomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== deletedRoomId));
    setActiveRoom(null);
    setInfoOpen(false);
  };

  return (
    <div className="flex h-full w-full relative justify-center items-center">
      
      {/* Wrapper containing the main chat dashboard and sidebar */}
      <div className="flex-1 max-w-[1400px] h-full relative flex items-center justify-center z-10">
        
        {/* Main Panel */}
        <div className="w-full h-full rounded-[24px] bg-[#02040a]/40 backdrop-blur-md border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex overflow-hidden relative z-10">
          
          {/* Sidebar */}
          <div className="w-80 md:w-88 shrink-0 flex flex-col h-full border-r border-white/[0.06] bg-black/20">
            <ChatSidebar 
              currentUser={currentUser} 
              rooms={filteredRoomsByTab} 
              activeRoom={activeRoom} 
              unreadCounts={unreadCounts}
              onSelectRoom={handleSelectRoom} 
              onRoomCreated={handleRoomCreated} 
            />
          </div>
          
          {/* Message view */}
          <div className="flex-1 flex flex-col h-full bg-black/10 relative overflow-hidden">
            {activeRoom ? (
              <ChatWindow 
                currentUser={currentUser} 
                room={activeRoom} 
                allUsers={allUsers}
                onRoomUpdated={handleRoomUpdated}
                onRoomDeleted={handleRoomDeleted}
                infoOpen={infoOpen}
                setInfoOpen={setInfoOpen}
                onMessagesLoaded={setActiveRoomMessages}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--accent)]/5 blur-[80px] rounded-full" />
                </div>

                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.45, 0.3]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-inner mb-6 flex items-center justify-center"
                >
                  <MessageSquare className="h-12 w-12 text-[var(--accent)]" strokeWidth={1.2} />
                </motion.div>
                
                <h3 className="text-lg font-medium text-white typo-heading mb-1.5 z-10">
                  Select a conversation
                </h3>
                <p className="text-xs text-[#a1a1aa] text-center max-w-sm px-4 typo-body leading-relaxed z-10 font-light">
                  Choose a room from the list on the left or create a new group to connect with the Media & IT team.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Info Drawer on the right */}
        <AnimatePresence>
          {infoOpen && activeRoom && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 xl:left-full xl:right-auto xl:ml-5 top-0 bottom-0 w-[330px] rounded-[24px] bg-[#02040a]/40 backdrop-blur-md border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col z-20 overflow-hidden"
            >
              <GroupInfoSidebar
                room={activeRoom}
                currentUser={currentUser}
                allUsers={allUsers}
                onClose={() => setInfoOpen(false)}
                onRoomUpdated={handleRoomUpdated}
                onRoomDeleted={handleRoomDeleted}
                messages={activeRoomMessages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
