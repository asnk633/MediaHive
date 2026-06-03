'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, MessageSquareIcon, Search, HelpCircle, Users2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDriveImageUrl } from '@/lib/driveUtils';

// Helper to resolve the default gradient background
const getRoomIconStyle = (iconUrl: string = '', roomName: string = 'Room') => {
  return 'from-indigo-600 to-violet-600';
};

/** Per-room avatar — extracted so each card gets its own error state without hooks-in-loops */
function RoomAvatar({ iconUrl, name, gradient }: { iconUrl?: string; name: string; gradient: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name ? name.substring(0, 2).toUpperCase() : 'RM';
  const canShowImage = !!(iconUrl && iconUrl.startsWith('http')) && !imgError;
  return (
    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0 font-semibold text-xs tracking-wider shadow-inner shadow-white/10 group-hover:scale-105 transition-transform duration-300 overflow-hidden`}>
      {canShowImage ? (
        <img
          src={getDriveImageUrl(iconUrl!, undefined, true)}
          alt={initials}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

const formatLastMsgTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function ChatSidebar({ currentUser, rooms, activeRoom, unreadCounts = {}, onSelectRoom, onRoomCreated }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          creatorId: currentUser.id,
          tenantId: currentUser.tenantId,
        })
      });
      const data = await res.json();
      if (res.ok) {
        onRoomCreated({ id: data.roomId, name: data.name, createdBy: currentUser.id, isMediaTeamOnly: false });
        setIsCreating(false);
        setNewRoomName('');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter rooms based on query
  const filteredRooms = rooms.filter((room: any) => 
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#050816]/30 backdrop-blur-md">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold tracking-wider text-white uppercase typo-label flex items-center gap-2.5">
          <MessageSquareIcon className="h-4 w-4 text-indigo-400" />
          Conversations
        </h2>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.05] text-indigo-300 hover:text-indigo-200 transition-all cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-liquid border-white/[0.08] text-white shadow-2xl rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="typo-heading text-lg text-white font-medium">Create Chat Room</DialogTitle>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Start a group to communicate. All Media & IT team members are automatically added as default participants.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <Label htmlFor="room-name" className="text-xs font-semibold text-indigo-200 tracking-wider uppercase typo-label">Room Name</Label>
                <Input 
                  id="room-name"
                  value={newRoomName} 
                  onChange={e => setNewRoomName(e.target.value)} 
                  placeholder="e.g. Video Production - Campaign"
                  className="bg-black/40 border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-500/50 rounded-xl focus:ring-1 focus:ring-indigo-500/50 h-10 px-4"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsCreating(false)}
                className="hover:bg-white/[0.05] hover:text-white border border-white/[0.04] rounded-xl h-10 px-4"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRoom} 
                disabled={loading || !newRoomName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:bg-indigo-950 disabled:text-indigo-400 h-10 px-4"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dynamic Search Bar */}
      <div className="px-4 py-3 border-b border-white/[0.04] shrink-0 relative flex items-center">
        <Search className="absolute left-7 h-3.5 w-3.5 text-white/30 pointer-events-none" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search rooms..." 
          className="w-full pl-9 pr-4 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/30 transition-all font-light"
        />
      </div>

      {/* Room list scroll container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/30 flex flex-col items-center justify-center gap-3">
            <HelpCircle className="h-6 w-6 text-white/10" strokeWidth={1} />
            {searchQuery ? 'No matching rooms found' : 'No chats yet. Create one to get started.'}
          </div>
        ) : (
          <ul className="space-y-1">
            {filteredRooms.map((room: any) => {
              const isActive = activeRoom?.id === room.id;
              const gradient = getRoomIconStyle(room.icon_url, room.name);
              const unreadCount = unreadCounts[room.id] || 0;
              
              return (
                <li key={room.id} className="animate-in fade-in duration-200">
                  <button
                    onClick={() => onSelectRoom(room)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-300 flex items-center gap-3.5 relative border group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600/[0.06] text-white border-indigo-500/25 shadow-[0_0_24px_rgba(99,102,241,0.06)]' 
                        : unreadCount > 0
                          ? 'bg-white/[0.01] hover:bg-white/[0.03] border-indigo-500/10 text-white shadow-[0_0_16px_rgba(99,102,241,0.03)]'
                          : 'hover:bg-white/[0.02] border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    {/* Glowing indicator bar on the left */}
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    )}

                    <RoomAvatar iconUrl={room.icon_url} name={room.name || 'Support Chat'} gradient={gradient} />

                    {/* Meta info */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <div className={`font-semibold text-xs truncate group-hover:translate-x-0.5 transition-transform duration-300 ${unreadCount > 0 ? 'text-white font-bold' : 'text-white/80'}`}>{room.name || 'Support Chat'}</div>
                        {room.last_message_time && (
                          <span className={`text-[9px] shrink-0 font-light tracking-wide ${unreadCount > 0 ? 'text-indigo-400 font-medium' : 'text-white/30'}`}>
                            {formatLastMsgTime(room.last_message_time)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-3 mt-1">
                        {room.lastMessagePreview || room.last_message_preview ? (
                          <div className={`text-[10px] truncate leading-tight flex-1 font-light ${unreadCount > 0 ? 'text-white font-medium' : 'text-[#a1a1aa]'}`}>
                            {room.lastMessagePreview || room.last_message_preview}
                          </div>
                        ) : (
                          <div className="text-[10px] text-white/30 flex items-center gap-1 leading-tight font-light flex-1">
                            <Users2 className="h-2.5 w-2.5" />
                            Click to enter chat
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-black text-white shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse shrink-0 typo-mono leading-none">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
