'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  SendIcon, 
  PaperclipIcon, 
  FileText, 
  ArrowDown, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  Shield, 
  Info, 
  Search, 
  X, 
  Image as ImageIcon,
  Mic,
  Camera,
  Video,
  CheckCheck,
  Check,
  Clock,
  Plus,
  Folder,
  Edit2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { getDriveImageUrl } from '@/lib/driveUtils';
import { MediaCaptureModal } from './MediaCaptureModal';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';
import { setLastReadTimestamp } from '@/lib/chatUnreadTracker';
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

// Repeating SVG doodle pattern for chat backgrounds
const whatsappPattern = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="white" stroke-width="0.6" stroke-opacity="0.4"><path d="M15 15h12v12H15z" /><circle cx="60" cy="20" r="3" /><path d="M90 15l4 4-4 4-4-4z" /><path d="M20 50c3-5 9-5 12 0" /><circle cx="95" cy="55" r="2" /><path d="M55 55l6 6-6 6-6-6z" /><path d="M15 90l3 3-3 3-3-3z" /><circle cx="60" cy="95" r="3.5" /><path d="M90 90h12v12H90z" /></svg>`;

const formatDateHeader = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (checkDate.getTime() === today.getTime()) {
    return 'TODAY';
  } else if (checkDate.getTime() === yesterday.getTime()) {
    return 'YESTERDAY';
  } else {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      let day = date.getDay();
      day = day === 0 ? 6 : day - 1;
      return weekdays[day].toUpperCase();
    }
    return date.toLocaleDateString();
  }
};

function AnimatedReadReceipt({ isNew }: { isNew: boolean }) {
  const [read, setRead] = useState(false);

  useEffect(() => {
    if (!isNew) {
      setRead(true);
      return;
    }
    // Double gray ticks transition to amber ticks after 1.2s to simulate delivery & read status
    const timer = setTimeout(() => {
      setRead(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isNew]);

  return (
    <CheckCheck 
      className={`h-3.5 w-3.5 transition-colors duration-500 ease-out shrink-0 ${
        read ? 'text-amber-400' : 'text-white/30'
      }`} 
    />
  );
}

export default function ChatWindow({ 
  currentUser, 
  room, 
  allUsers, 
  onRoomUpdated, 
  onRoomDeleted,
  infoOpen,
  setInfoOpen,
  onMessagesLoaded
}: { 
  currentUser: any; 
  room: any; 
  allUsers: any[]; 
  onRoomUpdated?: (room: any) => void; 
  onRoomDeleted?: (roomId: string) => void;
  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;
  onMessagesLoaded?: (messages: any[]) => void;
}) {
  // Messages & Input States
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [headerIconError, setHeaderIconError] = useState(false);
  
  // Interactive Panels States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Group Info Participants (needed for count in header)
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Rich Media Attachments States
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraftText, setEditDraftText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Sync edited details when selected room changes
  useEffect(() => {
    setSearchQuery('');
    setSearchOpen(false);
    setHeaderIconError(false);
  }, [room.id, room.name, room.icon_url]);

  // Fetch Message Stream
  // Fetch Message Stream
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        
        setMessages(prev => {
          // Keep all messages fetched from backend
          const localOptimistic = prev.filter(m => m.id.toString().startsWith('temp-'));
          
          // Filter out optimistic messages that have already been saved and returned by backend
          const pendingOptimistic = localOptimistic.filter(op => {
            return !data.some((d: any) => 
              d.sender_id === op.sender_id && 
              d.text === op.text &&
              Math.abs(new Date(d.created_at).getTime() - new Date(op.created_at).getTime()) < 30000
            );
          });
          
          return [...data, ...pendingOptimistic];
        });

        if (currentUser?.id) {
          setLastReadTimestamp(currentUser.id, room.id);
        }
        if (isInitialLoad.current) {
          scrollToBottom('auto', true);
          isInitialLoad.current = false;
        } else {
          scrollToBottom('smooth', false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    isInitialLoad.current = true;
    fetchMessages();
    
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [room.id]);

  // Sync messages list to parent ChatLayout for GroupInfoSidebar media scraping
  useEffect(() => {
    if (onMessagesLoaded) {
      onMessagesLoaded(messages);
    }
  }, [messages, onMessagesLoaded]);

  // Listen for clear chat events
  useEffect(() => {
    const handleChatCleared = (clearedRoomId: string) => {
      if (clearedRoomId === room.id) {
        setMessages([]);
        if (onMessagesLoaded) {
          onMessagesLoaded([]);
        }
      }
    };

    eventBus.on('chat_cleared', handleChatCleared);
    return () => {
      eventBus.off('chat_cleared', handleChatCleared);
    };
  }, [room.id, onMessagesLoaded]);

  // Fetch Participants roster (needed for count in header)
  useEffect(() => {
    const fetchMembers = async () => {
      if (!room.id) return;
      
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

    fetchMembers();
  }, [room.id]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto', force: boolean = false) => {
    if (!force && messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (!isNearBottom) return; // Don't auto-scroll if user is looking at past messages
    }
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollButton(isScrolledUp);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}`;

    // Optimistic UI updates
    const optimisticMsg = {
      id: tempId,
      text: textToSend,
      sender_id: currentUser.id,
      media_type: 'text',
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom('smooth', true);

    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          text: textToSend,
          tenantId: currentUser.tenantId
        })
      });
      if (res.ok) {
        await fetchMessages();
      } else {
        throw new Error('Failed to send');
      }
    } catch (err) {
      console.error(err);
      // Mark optimistic message as failed
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const submitEditMessage = async (messageId: string) => {
    if (!editDraftText.trim()) return;
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, text: editDraftText.trim() })
      });
      if (res.ok) {
        setEditingMessageId(null);
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const myParticipant = participants.find(p => p.user_id === currentUser.id);
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, role: myParticipant?.role || currentUser.role })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [uploadMode, setUploadMode] = useState<'gallery' | 'file'>('gallery');

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const compressVideo = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        const MAX_WIDTH = 854;
        const MAX_HEIGHT = 480;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        let stream;
        try {
          stream = canvas.captureStream(24);
        } catch (e) {
          resolve(file);
          return;
        }

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8',
            videoBitsPerSecond: 1000000
          });
        } catch (e) {
          try {
            mediaRecorder = new MediaRecorder(stream, {
              videoBitsPerSecond: 1000000
            });
          } catch (e2) {
            resolve(file);
            return;
          }
        }
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
          const ext = (mediaRecorder.mimeType && mediaRecorder.mimeType.includes('mp4')) ? '.mp4' : '.webm';
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ext, {
            type: mediaRecorder.mimeType || 'video/webm',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        };
        
        video.play();
        mediaRecorder.start();
        
        const drawFrame = () => {
          if (video.paused || video.ended) {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
        };
        
        video.onplay = () => {
          drawFrame();
        };
        
        video.onended = () => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        };
        
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, (video.duration || 15) * 1000 + 1000);
      };
      
      video.onerror = () => resolve(file);
    });
  };

  const uploadFile = async (file: File, mode: 'gallery' | 'file' | 'voice' = 'gallery', durationSeconds?: number) => {
    setUploading(true);
    let targetFile = file;

    if (mode === 'gallery') {
      if (file.type.startsWith('image/')) {
        targetFile = await compressImage(file);
      } else if (file.type.startsWith('video/')) {
        targetFile = await compressVideo(file);
      }
    }

    const formData = new FormData();
    formData.append('file', targetFile);
    formData.append('roomId', room.id);

    try {
      const uploadRes = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      let mediaType = 'document';
      let textPayload: string | null = null;
      if (mode === 'gallery') {
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/') || file.name.endsWith('.webm') || file.type.startsWith('audio/webm') || file.type.startsWith('audio/ogg')) mediaType = 'voice';
      } else if (mode === 'voice') {
        mediaType = 'voice';
        textPayload = durationSeconds ? durationSeconds.toString() : null;
      } else if (mode === 'file') {
        textPayload = file.name;
      }

      await fetch(`/api/chat/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          mediaUrl: uploadData.url,
          driveFileId: uploadData.fileId,
          mediaType,
          text: textPayload,
          tenantId: currentUser.tenantId
        })
      });
      
      fetchMessages();
      scrollToBottom('smooth', true);
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, uploadMode);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Text highlights formatter for in-chat search
  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-400/40 text-white rounded-[3px] px-0.5 font-medium border border-amber-500/20">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Filter messages dynamically based on query and sort chronologically (oldest first, newest last)
  const displayMessages = messages
    .filter(m => {
      if (!searchOpen || !searchQuery.trim()) return true;
      return m.text?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const renderRoleBadge = (role: string) => {
    const normalized = role?.toLowerCase();
    if (normalized === 'admin') {
      return (
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 typo-mono flex items-center gap-1 shrink-0">
          <Shield className="h-2.5 w-2.5" />
          Admin
        </span>
      );
    } else if (normalized === 'manager') {
      return (
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 typo-mono shrink-0">
          Manager
        </span>
      );
    } else if (normalized === 'team') {
      return (
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 typo-mono shrink-0">
          IT Team
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 typo-mono shrink-0">
        Member
      </span>
    );
  };

  const initials = room.name ? room.name.substring(0, 2).toUpperCase() : 'RM';
  const headerIconGradient = getRoomIconStyle(room.icon_url, room.name);
  const isImageIcon = !!(room.icon_url && room.icon_url.trim() && room.icon_url.startsWith('http')) && !headerIconError;

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
      
      {/* Header Panel */}
      <div className="h-20 border-b border-white/[0.05] flex items-center justify-between px-6 bg-black/15 shrink-0 z-10">
        
        {/* Header Left: Clicking details toggles right collapsible Info drawer */}
        <button 
          onClick={() => setInfoOpen(!infoOpen)}
          className="flex items-center gap-3.5 text-left focus:outline-none cursor-pointer group"
        >
          {/* Custom group icon / Initials avatar */}
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${headerIconGradient} flex items-center justify-center text-white shrink-0 font-bold text-sm tracking-wider shadow-md shadow-black/25 group-hover:scale-105 transition-transform duration-300 overflow-hidden`}>
            {isImageIcon ? (
              <img src={getDriveImageUrl(room.icon_url, undefined, true)} alt={initials} className="h-full w-full object-cover" onError={() => setHeaderIconError(true)} />
            ) : (
              initials
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <h2 className="font-semibold text-sm text-white tracking-wide typo-heading flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
              {room.name}
              {room.isMediaTeamOnly && (
                <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                  Staff
                </span>
              )}
            </h2>
            <p className="text-[10px] text-[#a1a1aa] font-light">
              Click for group info • {participants.length} members
            </p>
          </div>
        </button>

        {/* Header Right Buttons */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Realtime in-chat search toggler */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-lg transition-all cursor-pointer ${searchOpen ? 'bg-white/10 text-indigo-400' : 'text-white/70 hover:text-white hover:bg-white/[0.04]'}`}
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearchQuery('');
            }}
          >
            <Search className="h-4.5 w-4.5" />
          </Button>

          {/* Right Collapsible Info drawer toggler */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-lg transition-all cursor-pointer ${infoOpen ? 'bg-white/10 text-indigo-400' : 'text-white/70 hover:text-white hover:bg-white/[0.04]'}`}
            onClick={() => setInfoOpen(!infoOpen)}
          >
            <Info className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Realtime In-Chat Search Frosted Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 48, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/25 border-b border-white/[0.04] px-6 flex items-center justify-between shrink-0 overflow-hidden"
          >
            <div className="flex-1 flex items-center gap-2 relative">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-white/30" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages in this channel..."
                className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-indigo-500/30 rounded-lg pl-8 pr-4 py-1 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-light"
              />
            </div>
            {searchQuery && (
              <span className="text-[10px] text-white/40 typo-mono mr-3 shrink-0">
                {displayMessages.length} matches
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/40 hover:text-white shrink-0 hover:bg-white/[0.04] rounded"
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages feed */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin z-10 relative bg-black/5"
      >
        {/* Repeating WhatsApp Doodle Wallpaper Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none z-0" 
          style={{ 
            backgroundImage: `url('${whatsappPattern}')`, 
            backgroundSize: '120px 120px' 
          }}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#a1a1aa] text-xs relative z-10">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            Loading messages...
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center text-[#a1a1aa] text-xs py-24 flex flex-col items-center justify-center gap-3 relative z-10">
            <div className="p-4 rounded-full bg-white/[0.01] border border-white/5">
              <Sparkles className="h-6 w-6 text-indigo-400" strokeWidth={1.2} />
            </div>
            <div>
              <p className="font-medium text-white mb-0.5">{searchQuery ? 'No matching text found' : 'This is the start of your secure chat'}</p>
              <p className="text-[11px] font-light">{searchQuery ? 'Try searching for other keywords.' : 'Say hello or share a document to begin.'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {displayMessages.map((msg, index) => {
              const isMe = msg.sender_id === currentUser.id;
              const sender = allUsers.find((u: any) => u.id === msg.sender_id);
              const senderName = isMe ? currentUser.fullName : (sender?.full_name || 'Guest User');
              const senderInitials = senderName.substring(0, 2).toUpperCase();
              const senderGradient = getUserGradient(senderName);
              const senderRole = isMe ? currentUser.role : (sender?.role || 'member');

              const senderAvatarUrl = isMe 
                ? (currentUser.avatarUrl || currentUser.photoURL) 
                : (sender?.avatar_url || sender?.avatarUrl);
              const senderAvatarDriveId = isMe 
                ? currentUser.avatarDriveId 
                : (sender?.avatar_drive_id || sender?.avatarDriveId);
              const resolvedAvatarSrc = getDriveImageUrl(senderAvatarUrl, senderAvatarDriveId);

              const prevMsg = index > 0 ? displayMessages[index - 1] : null;
              const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id || 
                (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 120000);

              // Group timeline date headers
              let showDateHeader = false;
              if (index === 0) {
                showDateHeader = true;
              } else if (prevMsg) {
                const prevDate = new Date(prevMsg.created_at);
                const currDate = new Date(msg.created_at);
                if (currDate.toDateString() !== prevDate.toDateString()) {
                  showDateHeader = true;
                }
              }

              return (
                <React.Fragment key={msg.id}>
                  {showDateHeader && (
                    <div className="flex justify-center my-4 select-none">
                      <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/55 tracking-wider uppercase backdrop-blur-sm">
                        {formatDateHeader(msg.created_at)}
                      </div>
                    </div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex gap-3.5 group max-w-4xl ${isMe ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}
                  >
                    {/* User Avatar */}
                    {showHeader ? (
                      resolvedAvatarSrc ? (
                        <img 
                          src={resolvedAvatarSrc} 
                          alt={senderName} 
                          className="h-8 w-8 rounded-lg object-cover shrink-0 shadow-md shadow-black/25 select-none"
                        />
                      ) : (
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${senderGradient} flex items-center justify-center text-white shrink-0 font-bold text-[10px] shadow-md shadow-black/25 select-none`}>
                          {senderInitials}
                        </div>
                      )
                    ) : (
                      <div className="w-8 shrink-0" />
                    )}

                    {/* Content Column */}
                    <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold text-white tracking-wide">{senderName}</span>
                        </div>
                      )}                      {/* Bubble + Chevron Wrapper */}
                      <div
                        className="group"
                        style={{ display: 'inline-block', maxWidth: '100%', position: 'relative' }}
                      >
                      {/* Bubble */}
                      <div 
                        className={`py-2 shadow-lg flex flex-col ${
                          isMe 
                            ? 'bg-white/[0.07] border border-white/[0.06] text-white shadow-black/10 pl-3.5 pr-7' 
                            : 'glass-card border border-white/5 text-white shadow-black/10 pl-7 pr-3.5'
                        }`}
                        style={{
                          borderTopLeftRadius: !isMe ? '0px' : '16px',
                          borderTopRightRadius: isMe ? '0px' : '16px',
                          borderBottomLeftRadius: '16px',
                          borderBottomRightRadius: '16px'
                        }}
                      >
                        {msg.is_deleted ? (
                          <p className="text-xs italic text-white/40 leading-relaxed font-light select-none">
                            This message was deleted
                          </p>
                        ) : (
                          <>
                            {editingMessageId === msg.id ? (
                              <div className="flex flex-col gap-2 py-1 min-w-[200px]">
                                <textarea
                                  value={editDraftText}
                                  onChange={e => setEditDraftText(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white resize-none focus:outline-none focus:border-indigo-500"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/80 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => submitEditMessage(msg.id)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] text-white font-semibold transition-colors"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              msg.text && msg.media_type !== 'document' && msg.media_type !== 'image' && msg.media_type !== 'video' && msg.media_type !== 'voice' && (
                                <p className="text-xs leading-relaxed font-light whitespace-pre-wrap select-text selection:bg-white/20">
                                  {/* Real-time search highlighting */}
                                  {searchOpen && searchQuery ? highlightText(msg.text, searchQuery) : msg.text}
                                </p>
                              )
                            )}

                            {/* Attachments drawer */}
                            {msg.media_url && (
                              <div className={msg.text ? "mt-2.5 border-t border-white/10 pt-2.5" : ""}>
                                {msg.media_type === 'image' ? (
                                  <div className="relative overflow-hidden rounded-none border border-white/10 bg-black/30 group/img max-w-sm">
                                    <img src={getDriveImageUrl(msg.media_url, msg.drive_file_id, true)} alt="attachment" className="rounded-none max-h-60 w-full object-cover transition-transform duration-300 group-hover/img:scale-105" />
                                    <a 
                                      href={getDriveImageUrl(msg.media_url, msg.drive_file_id)} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 text-xs font-medium text-white transition-opacity duration-300 cursor-pointer"
                                    >
                                      <ArrowDown className="h-4 w-4 bg-white/10 p-1 rounded-full shrink-0" />
                                      Open Original
                                    </a>
                                  </div>
                                ) : msg.media_type === 'video' ? (
                                  <div className="relative overflow-hidden rounded-none border border-white/10 bg-black/40 shadow-xl max-w-[280px] sm:max-w-sm group/video">
                                    <video 
                                      src={getDriveImageUrl(msg.media_url, msg.drive_file_id)} 
                                      controls 
                                      className="rounded-none max-h-96 w-full h-auto object-contain bg-black/50"
                                      preload="metadata"
                                      playsInline
                                    />
                                  </div>
                                ) : msg.media_type === 'voice' ? (
                                  <VoicePlayer 
                                    src={getDriveImageUrl(msg.media_url, msg.drive_file_id)} 
                                    durationSeconds={msg.text ? parseInt(msg.text, 10) : null}
                                  />
                                ) : (
                                  <a 
                                    href={msg.media_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-3 p-3 bg-black/20 hover:bg-black/30 border border-white/5 hover:border-white/10 rounded-xl max-w-xs transition-all group/doc"
                                  >
                                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover/doc:scale-105 transition-transform duration-300 shrink-0">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden text-left">
                                      <div className="text-[11px] font-semibold text-white truncate">
                                        {msg.text || "Shared Document"}
                                      </div>
                                      <div className="text-[9px] text-[#a1a1aa] typo-mono mt-0.5 truncate flex items-center gap-1.5">
                                        Click to view on Drive
                                        <ChevronRight className="h-3 w-3 inline text-white/30 shrink-0" />
                                      </div>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* WhatsApp-style Timestamp & Read receipts at the bottom right */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] select-none opacity-60 self-end">
                          {msg.is_edited && !msg.is_deleted && (
                            <span className="text-[9px] text-white/40 italic mr-1 select-none">(edited)</span>
                          )}
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span className="flex items-center shrink-0 ml-1 select-none">
                              {msg.status === 'sending' ? (
                                <Clock className="h-3 w-3 text-white/45 animate-pulse" />
                              ) : msg.status === 'error' ? (
                                <span className="text-rose-500 font-bold text-[10px]" title="Failed to send">!</span>
                              ) : (
                                <AnimatedReadReceipt isNew={Date.now() - new Date(msg.created_at).getTime() < 5000} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>{/* END bubble div */}

                        {/* Chevron: OUTSIDE the bubble flex container, sibling to bubble */}
                        {!msg.is_deleted && (msg.sender_id === currentUser.id || participants.find(p => p.user_id === currentUser.id)?.role?.toLowerCase() === 'manager' || participants.find(p => p.user_id === currentUser.id)?.role?.toLowerCase() === 'creator') && (
                          <div 
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            style={{
                              position: 'absolute',
                              zIndex: 30,
                              top: '4px',
                              right: isMe ? '4px' : 'auto',
                              left: !isMe ? '4px' : 'auto'
                            }}
                          >
                            <div
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                              }}
                              style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.55)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', outline: 'none', minHeight: 0, minWidth: 0, width: 'auto', height: 'auto' }}
                              title="Actions"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </div>

                            {/* Custom Glassmorphic Popover Menu */}
                            <AnimatePresence>
                              {activeMenuId === msg.id && (
                                <>
                                  {/* Invisible backdrop click-away */}
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                    }}
                                  />
                                  {/* Animated Menu Panel */}
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.12 }}
                                    className={`absolute ${isMe ? 'right-0' : 'left-0'} mt-1.5 w-36 rounded-xl bg-[#0c1029]/95 border border-white/[0.12] shadow-2xl shadow-black/80 backdrop-blur-2xl py-1.5 z-50`}
                                  >
                                    {msg.sender_id === currentUser.id && (msg.media_type === 'text' || !msg.media_url) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setEditingMessageId(msg.id);
                                          setEditDraftText(msg.text || '');
                                        }}
                                        className="w-full px-3 py-2 text-left text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                        <span>Edit message</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleDeleteMessage(msg.id);
                                      }}
                                      className="w-full px-3 py-2 text-left text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                      <span>Delete message</span>
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>{/* END bubble+chevron wrapper */}
                      </div>
                    </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => scrollToBottom('smooth', true)}
            className="absolute bottom-24 right-8 p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-900/50 z-50 border border-white/10 transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area Panel */}
      <div className="p-4 border-t border-white/[0.05] bg-black/20 shrink-0 z-10 relative">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2.5 max-w-4xl mx-auto relative bg-white/[0.01] border border-white/[0.06] shadow-2xl p-2.5 rounded-2xl backdrop-blur-md">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
            accept="image/*, audio/*, application/pdf, .doc, .docx"
          />

          {isRecording ? (
            <VoiceRecorder 
              onStop={async (file, duration) => {
                setIsRecording(false);
                await uploadFile(file, 'voice', duration);
              }}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <>
              <div className="relative shrink-0">
                {/* Premium Glassmorphic Attachment Card */}
                <AnimatePresence>
                  {attachmentMenuOpen && (
                    <>
                      {/* Backdrop overlay with subtle dim */}
                      <motion.div
                        className="fixed inset-0 z-40 bg-black/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setAttachmentMenuOpen(false)}
                      />
                      {/* Floating card */}
                      <motion.div
                        className="absolute bottom-14 left-1/2 z-50 w-[260px] -translate-x-1/2"
                        initial={{ opacity: 0, y: 12, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      >
                        <div className="rounded-2xl bg-[#0c1029]/90 border border-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-2xl p-5">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Voice Note */}
                            <button
                              type="button"
                              onClick={() => { setAttachmentMenuOpen(false); setIsRecording(true); }}
                              className="flex flex-col items-center gap-2.5 group cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25 transition-transform duration-300 group-hover:scale-110">
                                <Mic className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-[11px] font-medium text-white/60 group-hover:text-white/90 transition-colors">Voice Note</span>
                            </button>

                            {/* Camera */}
                            <button
                              type="button"
                              onClick={() => { setAttachmentMenuOpen(false); setCameraOpen(true); }}
                              className="flex flex-col items-center gap-2.5 group cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-110">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-[11px] font-medium text-white/60 group-hover:text-white/90 transition-colors">Camera</span>
                            </button>

                            {/* Gallery */}
                            <button
                              type="button"
                              onClick={() => {
                                setAttachmentMenuOpen(false);
                                setUploadMode('gallery');
                                if (fileInputRef.current) {
                                  fileInputRef.current.accept = "image/*,video/*";
                                  fileInputRef.current.click();
                                }
                              }}
                              className="flex flex-col items-center gap-2.5 group cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-110">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-[11px] font-medium text-white/60 group-hover:text-white/90 transition-colors">Gallery</span>
                            </button>

                            {/* Files */}
                            <button
                              type="button"
                              onClick={() => {
                                setAttachmentMenuOpen(false);
                                setUploadMode('file');
                                if (fileInputRef.current) {
                                  fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*,video/*";
                                  fileInputRef.current.click();
                                }
                              }}
                              className="flex flex-col items-center gap-2.5 group cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform duration-300 group-hover:scale-110">
                                <Folder className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-[11px] font-medium text-white/60 group-hover:text-white/90 transition-colors">Files</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Plus trigger button */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className={`h-9 w-9 rounded-full border transition-all duration-300 cursor-pointer ${attachmentMenuOpen ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25' : 'bg-white/[0.03] hover:bg-white/[0.08] text-[#a1a1aa] hover:text-white border-white/[0.06]'}`}
                  onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                  ) : (
                    <Plus className={`h-4 w-4 transition-transform duration-500 ease-in-out ${attachmentMenuOpen ? 'rotate-45' : ''}`} />
                  )}
                </Button>
              </div>
              
              <div className="flex-1">
                <textarea 
                  value={inputText}
                  rows={1}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={uploading ? "Securing and uploading to Workspace Drive..." : "Message team..."}
                  className="w-full bg-transparent border-0 py-2.5 px-1.5 focus:outline-none focus:ring-0 text-xs text-white placeholder-white/20 resize-none font-light leading-relaxed scrollbar-none max-h-24 h-9"
                  disabled={uploading}
                />
              </div>
              
              <Button 
                type="submit" 
                size="icon" 
                className="shrink-0 h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10 cursor-pointer disabled:bg-indigo-950 disabled:text-indigo-400 transition-all" 
                disabled={!inputText.trim() || uploading}
              >
                <SendIcon className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </form>
      </div>

      <MediaCaptureModal 
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={async (file) => {
          await uploadFile(file);
        }}
      />

    </div>
  );
}
