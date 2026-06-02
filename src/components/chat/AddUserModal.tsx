'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlusIcon, Search, Shield, ShieldAlert, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

// User Initials Gradient Helper
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

export default function AddUserModal({ room, currentUser, allUsers, trigger }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    if (selectedUserIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUserIds: selectedUserIds,
          addedById: currentUser.id,
          tenantId: currentUser.tenantId,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOpen(false);
        setSelectedUserIds([]);
        setSearchQuery('');
        alert('Users added successfully. Managers have been notified.');
      } else {
        alert(data.error || data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // Filter users based on query
  const filteredUsers = allUsers.filter((u: any) => 
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render role badges in premium style
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 rounded-lg border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.05] text-[#a1a1aa] hover:text-white font-medium text-xs tracking-wide transition-all gap-1.5 cursor-pointer px-3"
          >
            <UserPlusIcon className="h-3.5 w-3.5" />
            Add Person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-liquid border-white/[0.08] text-white shadow-2xl rounded-2xl max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="typo-heading text-lg text-white font-medium flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
            Add to Chat
          </DialogTitle>
          <div className="text-xs text-[#a1a1aa] mt-1.5 leading-relaxed bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl flex gap-2 items-start">
            <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Adding users immediately grants chat access. Managers receive an instant veto alert.
            </span>
          </div>
        </DialogHeader>

        {/* Custom Searchable Interactive User Picker */}
        <div className="py-4 flex-1 flex flex-col overflow-hidden min-h-[250px]">
          <div className="relative flex items-center mb-3 shrink-0">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..." 
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/[0.06] rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/30 transition-all font-light"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin max-h-[300px]">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/30 font-light">
                No users found matching your search.
              </div>
            ) : (
              filteredUsers.map((u: any) => {
                const isSelected = selectedUserIds.includes(u.id);
                const initials = u.fullName ? u.fullName.substring(0, 2).toUpperCase() : 'US';
                const gradient = getUserGradient(u.fullName);

                return (
                  <button
                    key={u.id}
                    onClick={() => handleToggleUser(u.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3.5 border group cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600/[0.06] border-indigo-500/30 shadow-[0_0_18px_rgba(99,102,241,0.05)] text-white' 
                        : 'bg-white/[0.01] hover:bg-white/[0.03] border-transparent text-white/80 hover:text-white'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0 font-semibold text-[10px] tracking-wider shadow-inner shadow-white/10 group-hover:scale-105 transition-transform duration-300`}>
                      {initials}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium truncate">{u.fullName}</div>
                        {renderRoleBadge(u.role)}
                      </div>
                      <div className="text-[10px] text-[#a1a1aa] font-light truncate mt-0.5">{u.email}</div>
                    </div>

                    {/* Checkbox circle */}
                    <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500 text-white' 
                        : 'border-white/10 bg-black/10 group-hover:border-white/20'
                    }`}>
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 shrink-0 border-t border-white/[0.04] pt-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsOpen(false);
              setSelectedUserIds([]);
              setSearchQuery('');
            }}
            className="hover:bg-white/[0.05] hover:text-white border border-white/[0.04] rounded-xl h-10 px-4"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddUser} 
            disabled={loading || selectedUserIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:bg-indigo-950 disabled:text-indigo-400 h-10 px-4 flex items-center gap-1.5"
          >
            {loading ? (
              'Adding...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Add {selectedUserIds.length > 1 ? `${selectedUserIds.length} Persons` : 'Person'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
