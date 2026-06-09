'use client';

import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import GroupInfoSidebar from './GroupInfoSidebar';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setLastReadTimestamp, getLastReadTimestamps } from '@/lib/chatUnreadTracker';

import { useSearchParams } from 'next/navigation';

export default function ChatLayout({ currentUser, initialRooms, allUsers }: { currentUser: any, initialRooms: any[], allUsers: any[] }) {
  const searchParams = useSearchParams();
  const defaultRoomId = searchParams.get('room');
  const [rooms, setRooms] = useState<any[]>(initialRooms);
  const initialActiveRoom = defaultRoomId ? (initialRooms.find(r => r.id === defaultRoomId) || { id: defaultRoomId, name: null }) : null;
  const [activeRoom, setActiveRoom] = useState<any | null>(initialActiveRoom);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeRoomMessages, setActiveRoomMessages] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

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

    window.addEventListener('play', handleGlobalPlay, true); // Capture phase since 'play' doesn't bubble
    return () => {
      window.removeEventListener('play', handleGlobalPlay, true);
    };
  }, []);

  // Polling rooms list and dynamic unread message counts
  useEffect(() => {
    if (!currentUser?.id) return;

    const pollRooms = async () => {
      try {
        const lastReadMap = getLastReadTimestamps(currentUser.id);
        const res = await fetch(`/api/chat/rooms?userId=${currentUser.id}&lastRead=${encodeURIComponent(JSON.stringify(lastReadMap))}`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
          
          const counts: Record<string, number> = {};
          data.forEach((r: any) => {
            counts[r.id] = activeRoom?.id === r.id ? 0 : (r.unreadCount || 0);
          });
          setUnreadCounts(counts);
        }
      } catch (err) {
        console.error("Error polling rooms in ChatLayout:", err);
      }
    };

    pollRooms();

    const interval = setInterval(pollRooms, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id, activeRoom?.id]);

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
      
      {/* Wrapper of Container 1 that centers and acts as positioning anchor for Container 2 */}
      <div className="flex-1 max-w-[1000px] h-full relative flex items-center justify-center z-10">
        
        {/* Container 1: Main Chat Area (Sidebar + Message Pane) */}
        <div className="w-full h-full rounded-[24px] bg-[var(--glass-card-bg)] backdrop-blur-md border border-[var(--glass-card-border)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex overflow-hidden relative z-10">
          
          {/* Sidebar Panel */}
          <div className="w-80 md:w-88 shrink-0 flex flex-col h-full border-r border-border bg-foreground/[0.01]">
            <ChatSidebar 
              currentUser={currentUser} 
              rooms={rooms} 
              activeRoom={activeRoom} 
              unreadCounts={unreadCounts}
              onSelectRoom={handleSelectRoom} 
              onRoomCreated={handleRoomCreated} 
            />
          </div>
          
          {/* Content Area Panel */}
          <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
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
                {/* Ambient Inner Glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 blur-[80px] rounded-full" />
                </div>

                {/* Breathing Premium Icon wrapper */}
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
                  <MessageSquare className="h-12 w-12 text-indigo-400" strokeWidth={1.2} />
                </motion.div>
                
                <h3 className="text-lg font-medium text-foreground typo-heading mb-1.5 z-10">
                  Select a conversation
                </h3>
                <p className="text-xs text-foreground/60 text-center max-w-sm px-4 typo-body leading-relaxed z-10">
                  Choose a room from the list on the left or create a new group to connect with the Media & IT team.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Container 2: Collapsible Group Info Sidebar (Separate floating glass panel aligned outside Container 1) */}
        <AnimatePresence>
          {infoOpen && activeRoom && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 xl:left-full xl:right-auto xl:ml-5 top-0 bottom-0 w-[330px] rounded-[24px] bg-[var(--glass-card-bg)] backdrop-blur-md border border-[var(--glass-card-border)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col z-20 overflow-hidden"
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
