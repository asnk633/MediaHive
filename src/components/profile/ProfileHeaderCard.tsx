import React from 'react';
import { Settings, Edit2, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { getRoleBadgeColors } from '@/lib/roleStyles';
import { AuthUser } from '@/contexts/AuthContextProvider';

interface ProfileHeaderCardProps {
    user: AuthUser | null;
    onAvatarClick: () => void;
    isEditingName?: boolean;
    setIsEditingName?: (val: boolean) => void;
    newName?: string;
    setNewName?: (val: string) => void;
    onSaveName?: () => void;
    updatingName?: boolean;
}

export function ProfileHeaderCard({ 
    user, 
    onAvatarClick,
    isEditingName,
    setIsEditingName,
    newName,
    setNewName,
    onSaveName,
    updatingName
}: ProfileHeaderCardProps) {
    const role = user?.role;
    const is_super_admin = user?.email === 'media@thaibagarden.com' || user?.is_super_admin;

    return (
        <div className="w-full bg-card border border-border rounded-2xl p-6 flex items-center gap-6">
            <div className="relative group shrink-0">
                <button
                    onClick={onAvatarClick}
                    className="h-14 w-14 rounded-full shadow-lg overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 ring-2 ring-border group-hover:ring-primary/30"
                >
                    <SafeAvatar
                        src={user?.avatar_url || null}
                        alt={user?.name || "Profile"}
                        size={56}
                        className="w-full h-full bg-cover"
                        priority={true}
                    />
                </button>
                <button
                    onClick={onAvatarClick}
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors backdrop-blur-sm z-10"
                >
                    <Settings size={12} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-start gap-1">
                {isEditingName ? (
                    <div className="flex items-center gap-2 w-full max-w-xs">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName?.(e.target.value)}
                            className="flex-1 bg-surface border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                            placeholder="Display Name"
                        />
                        <button 
                            onClick={onSaveName}
                            disabled={updatingName}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                        >
                            {updatingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button 
                            onClick={() => setIsEditingName?.(false)}
                            disabled={updatingName}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group/name">
                        <h2 className="text-lg font-semibold text-foreground">{user?.name || "User Name"}</h2>
                        <button 
                            onClick={() => setIsEditingName?.(true)}
                            className="p-1 rounded-md hover:bg-surface text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-all"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                        getRoleBadgeColors(role)
                    )}>
                        {is_super_admin ? "SUPER ADMIN" : (role || "Guest")}
                    </span>
                    {user?.official_name && (
                        <span className="text-sm text-muted-foreground border-l border-border pl-2">{user.official_name}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
