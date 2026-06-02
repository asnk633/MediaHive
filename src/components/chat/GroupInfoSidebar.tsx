'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Camera, 
  Edit2, 
  Calendar, 
  ImageIcon, 
  ArrowDown, 
  FileIcon, 
  FileText, 
  ChevronRight, 
  Loader2, 
  Shield, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import AddUserModal from './AddUserModal';
import { supabase } from '@/lib/supabaseClient';
import { getDriveImageUrl } from '@/lib/driveUtils';
import { GroupIconUploadModal } from './GroupIconUploadModal';
import { eventBus } from '@/lib/eventBus';

// Helper to resolve the default gradient background
const getRoomIconStyle = (iconUrl: string = '', roomName: string = 'Room') => {
  return 'from-indigo-600 to-violet-600';
};

// Senders initials gradients
const getUserGradient = (name: string = 'User') => {
  const gradients = [
    'from-blue-500 to-indigo-500',
    'from-teal-500 to-emerald-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-purple-500 to-fuchsia-500',
    'from-sky-500 to-blue-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function GroupInfoSidebar({ 
  room, 
  currentUser, 
  allUsers, 
  onClose, 
  onRoomUpdated, 
  onRoomDeleted,
  messages 
}: any) {
  const [creatorName, setCreatorName] = useState<string>('Unknown');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(room.name);
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const iconFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room.id) return;

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setIsEditorOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const handleDeleteIcon = async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconUrl: null })
      });
      if (res.ok) {
        setIsEditingIcon(false);
        if (onRoomUpdated) {
          onRoomUpdated({ id: room.id, icon_url: null });
        }
      } else {
        alert('Failed to delete group icon');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete group icon');
    }
  };

  // Collapsible drawers inside Group Info
  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(true);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(true);

  // Sync edited details when room changes
  useEffect(() => {
    setEditedName(room.name);
    setIsEditingName(false);
    setIsEditingIcon(false);
  }, [room.id, room.name, room.icon_url]);

  // Fetch Dynamic Creator Metadata & Participants roster
  useEffect(() => {
    const fetchCreatorAndMembers = async () => {
      if (!room.id) return;
      
      // Fetch Room Creator name
      if (room.created_by) {
        try {
          const { data: creator } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', room.created_by)
            .single();
          if (creator) setCreatorName(creator.full_name);
        } catch (e) {
          console.error(e);
        }
      }

      // Fetch Room Participants
      setLoadingParticipants(true);
      try {
        const res = await fetch(`/api/chat/rooms/${room.id}/participants`);
        if (res.ok) {
          const data = await res.json();
          setParticipants(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchCreatorAndMembers();
  }, [room.id, room.created_by]);

  // Group Renaming Save Trigger
  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === room.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName })
      });
      if (res.ok) {
        setIsEditingName(false);
        if (onRoomUpdated) {
          onRoomUpdated({ id: room.id, name: editedName });
        }
      } else {
        alert('Failed to save room name.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manager Delete Room Handler
  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsDeleting(false);
        if (onRoomDeleted) {
          onRoomDeleted(room.id);
        }
        alert('Chat room deleted successfully.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete chat room');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Manager Clear Chat Messages Handler
  const handleClearChat = async () => {
    setClearingChat(true);
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/clear?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsClearingChat(false);
        // Emit dynamic event for real-time wiping in UI
        eventBus.emit('chat_cleared', room.id);
        alert('Chat history cleared successfully.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to clear chat history.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while clearing chat.');
    } finally {
      setClearingChat(false);
    }
  };

  // Scrape image and file attachments from active message feed
  const scrapImages = messages.filter((m: any) => m.media_url && m.media_type === 'image');
  const scrapDocs = messages.filter((m: any) => m.media_url && m.media_type === 'document');

  const renderRoleBadge = (role: string) => {
    const normalized = role?.toLowerCase();
    if (normalized === 'admin') {
      return (
        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 typo-mono flex items-center gap-1 shrink-0">
          <Shield className="h-2 w-2" />
          Admin
        </span>
      );
    } else if (normalized === 'manager') {
      return (
        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 typo-mono shrink-0">
          Manager
        </span>
      );
    } else if (normalized === 'team') {
      return (
        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 typo-mono shrink-0">
          IT Team
        </span>
      );
    }
    return (
      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 typo-mono shrink-0">
        Member
      </span>
    );
  };

  const initials = room.name ? room.name.substring(0, 2).toUpperCase() : 'RM';
  const headerIconGradient = getRoomIconStyle(room.icon_url, room.name);
  const isImageIcon = !!(room.icon_url && room.icon_url.trim());
  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  return (
    <>
      {/* Drawer Header */}
      <div className="h-20 border-b border-white/[0.05] flex items-center justify-between px-5 shrink-0 bg-black/20">
        <span className="text-xs font-semibold text-white uppercase tracking-wider typo-label">Group Info</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg cursor-pointer"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Contents Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scroll-smooth">
        
        {/* Group Avatar and Dynamic Inline Editors */}
        <div className="flex flex-col items-center text-center pb-2">
          <div className="relative group/avatar mb-4">
            <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${headerIconGradient} flex items-center justify-center text-white font-bold text-2xl tracking-widest shadow-xl shadow-black/45 overflow-hidden transition-all duration-300 relative`}>
              {isImageIcon ? (
                <img src={getDriveImageUrl(room.icon_url)} alt="group-icon" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            
            {/* Dynamic Pencil trigger to set custom Preset Gradients / Custom Image URL */}
            <button 
              onClick={() => setIsEditingIcon(!isEditingIcon)}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/20 text-white shadow-lg cursor-pointer scale-90 opacity-0 group-hover/avatar:opacity-100 hover:scale-95 transition-all duration-300 z-10"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Edit presets selector drawer */}
          {isEditingIcon && (
            <div className="w-full bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl mb-4 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest typo-label block mb-1.5">Group Photo</span>
              <div className="w-full space-y-2">
                <input 
                  type="file"
                  ref={iconFileInputRef}
                  onChange={handleIconChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  onClick={() => iconFileInputRef.current?.click()} 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-8 rounded-lg text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Camera className="h-3.5 w-3.5 text-white" />
                  Choose Photo File
                </Button>

                {room.icon_url && room.icon_url.trim() !== '' && (
                  <Button 
                    onClick={handleDeleteIcon} 
                    variant="ghost"
                    className="w-full border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 h-8 rounded-lg text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Group Photo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Group Name inline editor */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5 w-full max-w-[240px] mt-1 bg-black/40 border border-white/[0.08] p-1.5 rounded-xl">
              <input 
                type="text" 
                value={editedName} 
                onChange={e => setEditedName(e.target.value)} 
                className="bg-transparent border-0 py-0.5 px-1 focus:ring-0 focus:outline-none text-xs text-white w-full font-medium"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setEditedName(room.name);
                    setIsEditingName(false);
                  }
                }}
              />
              <Button 
                size="icon" 
                onClick={handleSaveName}
                className="h-6 w-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shrink-0"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => {
                  setEditedName(room.name);
                  setIsEditingName(false);
                }}
                className="h-6 w-6 text-white/50 hover:text-white shrink-0 hover:bg-white/[0.05] rounded-lg"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <h3 className="font-semibold text-base text-white typo-heading flex items-center justify-center gap-2 group/title">
              {room.name}
              <button 
                onClick={() => setIsEditingName(true)}
                className="p-1 rounded bg-transparent opacity-0 group-hover/title:opacity-100 hover:bg-white/[0.05] text-[#a1a1aa] hover:text-white transition-all cursor-pointer"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </h3>
          )}

          {/* Creation Metadata */}
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-white/30 font-light typo-mono">
            <Calendar className="h-3 w-3 inline text-white/20 shrink-0" />
            <span>
              Created by <strong className="text-white/45">{creatorName}</strong> on{' '}
              {new Date(room.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Collapsible Section: Media, Links and Docs */}
        <div className="border-t border-white/[0.04] pt-4.5">
          <button 
            onClick={() => setMediaDrawerOpen(!mediaDrawerOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest typo-label">Media, Links & Docs</span>
            <span className="text-[10px] text-white/30 font-mono group-hover:text-indigo-400 transition-colors">
              {scrapImages.length + scrapDocs.length} items
            </span>
          </button>

          {mediaDrawerOpen && (
            <div className="mt-3.5 space-y-4 overflow-hidden animate-in fade-in duration-200">
              {/* Image scraper grid */}
              {scrapImages.length > 0 && (
                <div>
                  <div className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ImageIcon className="h-2.5 w-2.5 text-white/40" />
                    Recent Photos
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {scrapImages.slice(0, 6).map((img: any) => (
                      <a 
                        key={img.id}
                        href={getDriveImageUrl(img.media_url, img.drive_file_id)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="aspect-square rounded-lg border border-white/5 overflow-hidden bg-black/40 hover:border-indigo-500/50 hover:scale-[1.02] transition-all cursor-pointer relative group/thumb"
                      >
                        <img src={getDriveImageUrl(img.media_url, img.drive_file_id, true)} alt="media" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <ArrowDown className="h-3.5 w-3.5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents scraper listing */}
              {scrapDocs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileIcon className="h-2.5 w-2.5 text-white/40" />
                    Recent Documents
                  </div>
                  {scrapDocs.slice(0, 3).map((doc: any) => (
                    <a 
                      key={doc.id}
                      href={getDriveImageUrl(doc.media_url, doc.drive_file_id)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] rounded-xl text-left transition-all group/scraped"
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[10px] text-white truncate group-hover/scraped:text-indigo-300 transition-colors font-medium">Drive File Attachment</div>
                        <div className="text-[8px] text-[#a1a1aa] typo-mono truncate mt-0.5">Click to download</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {scrapImages.length === 0 && scrapDocs.length === 0 && (
                <div className="text-center text-[10px] text-white/20 py-4 font-light italic">
                  No media files found in this stream.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Section: Members Listing */}
        <div className="border-t border-white/[0.04] pt-4.5">
          <div className="flex items-center justify-between text-left mb-3">
            <button 
              onClick={() => setMembersDrawerOpen(!membersDrawerOpen)}
              className="flex items-center justify-between text-left focus:outline-none cursor-pointer group flex-1"
            >
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest typo-label">Participants</span>
              <span className="text-[10px] text-white/30 font-mono group-hover:text-indigo-400 transition-colors mr-3">
                {participants.length}
              </span>
            </button>

            {/* Inline Invite Trigger */}
            <AddUserModal 
              room={room} 
              currentUser={currentUser} 
              allUsers={allUsers}
              trigger={
                <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline cursor-pointer">
                  Add User
                </button>
              }
            />
          </div>

          {membersDrawerOpen && (
            <div className="space-y-2 overflow-hidden animate-in fade-in duration-200">
              {loadingParticipants ? (
                <div className="flex items-center gap-2 py-4 text-[#a1a1aa] text-[10px] font-light">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400 shrink-0" />
                  Refreshing list...
                </div>
              ) : (
                participants.map(p => {
                  const userInitials = p.fullName.substring(0, 2).toUpperCase();
                  const userGradient = getUserGradient(p.fullName);
                  const isItCreator = room.created_by === p.id;
                  const isParticipantMe = p.id === currentUser.id;

                  const pAvatarSrc = getDriveImageUrl(p.avatarUrl, p.avatarDriveId);

                  return (
                    <div 
                      key={p.id} 
                      className="flex items-center gap-3 p-2 bg-white/[0.01] border border-white/[0.03] rounded-xl"
                    >
                      {pAvatarSrc ? (
                        <img 
                          src={pAvatarSrc} 
                          alt={p.fullName} 
                          className="h-7 w-7 rounded-lg object-cover shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${userGradient} flex items-center justify-center text-white shrink-0 font-bold text-[9px]`}>
                          {userInitials}
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold text-white truncate">
                            {p.fullName} {isParticipantMe && '(You)'}
                          </div>
                          
                          {isItCreator ? (
                            <span className="text-[8px] font-medium tracking-wider uppercase px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shrink-0">
                              Owner
                            </span>
                          ) : (
                            renderRoleBadge(p.role)
                          )}
                        </div>
                        <div className="text-[9px] text-[#a1a1aa] truncate mt-0.5 font-light">{p.email}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Clear Chat & Delete Chatroom Buttons (Manager Only) */}
        {isManager && (
          <div className="border-t border-white/[0.04] pt-5 mt-6 shrink-0 space-y-3">
            {/* Clear Chat Option */}
            <Dialog open={isClearingChat} onOpenChange={setIsClearingChat}>
              <DialogTrigger asChild>
                <button className="w-full py-2.5 px-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Chat Messages
                </button>
              </DialogTrigger>
              <DialogContent className="glass-liquid border-amber-500/30 text-white shadow-2xl rounded-2xl max-w-sm">
                <DialogHeader className="text-center">
                  <DialogTitle className="typo-heading text-amber-400 font-medium flex items-center justify-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-amber-500 animate-pulse" />
                    Clear Chat History
                  </DialogTitle>
                  <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                    Are you sure you want to clear **"{room.name || 'this direct chat'}"**? This will permanently wipe all text message records from Supabase to free up database storage. Drive attachment files will remain saved.
                  </p>
                </DialogHeader>
                <DialogFooter className="gap-2 justify-center sm:justify-center mt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsClearingChat(false)}
                    className="hover:bg-white/[0.05] hover:text-white border border-white/[0.04] rounded-xl h-10 px-4"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleClearChat}
                    disabled={clearingChat}
                    className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/20 h-10 px-4"
                  >
                    {clearingChat ? 'Clearing...' : 'Yes, Clear Chat'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Group Option */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
              <DialogTrigger asChild>
                <button className="w-full py-2.5 px-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Group
                </button>
              </DialogTrigger>
              <DialogContent className="glass-liquid border-rose-500/30 text-white shadow-2xl rounded-2xl max-w-sm">
                <DialogHeader className="text-center">
                  <DialogTitle className="typo-heading text-rose-400 font-medium flex items-center justify-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-rose-500 animate-pulse" />
                    Delete Conversation
                  </DialogTitle>
                  <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                    Are you sure you want to delete **"{room.name}"**? This will permanently wipe all participants, media uploads, and message records.
                  </p>
                </DialogHeader>
                <DialogFooter className="gap-2 justify-center sm:justify-center mt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsDeleting(false)}
                    className="hover:bg-white/[0.05] hover:text-white border border-white/[0.04] rounded-xl h-10 px-4"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteRoom}
                    disabled={deleting}
                    className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 h-10 px-4"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Permanent'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

      </div>

      <GroupIconUploadModal 
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedImage(null);
        }}
        imageSrc={selectedImage}
        roomId={room.id}
        onRoomUpdated={onRoomUpdated}
      />
    </>
  );
}
