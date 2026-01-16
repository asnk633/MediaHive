import React from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { getRoleBadgeColors } from '@/lib/roleStyles';
import { AuthUser } from '@/contexts/AuthContext';

interface ProfileHeaderCardProps {
    user: AuthUser | null;
    onAvatarClick: () => void;
}

export function ProfileHeaderCard({ user, onAvatarClick }: ProfileHeaderCardProps) {
    const role = user?.role;
    const isSuperAdmin = user?.email === 'media@thaibagarden.com' || user?.isSuperAdmin;

    return (
        <div className="w-full bg-card border border-border rounded-2xl p-6 flex items-center gap-6">
            <div className="relative group shrink-0">
                <button
                    onClick={onAvatarClick}
                    className="h-14 w-14 rounded-full shadow-lg overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 ring-2 ring-border group-hover:ring-primary/30"
                >
                    <SafeAvatar
                        src={user?.avatarUrl || null}
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

            <div className="flex flex-col items-start gap-1">
                <h2 className="text-lg font-semibold text-foreground">{user?.name || "User Name"}</h2>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                        getRoleBadgeColors(role)
                    )}>
                        {isSuperAdmin ? "SUPER ADMIN" : (role || "Guest")}
                    </span>
                    {user?.officialName && (
                        <span className="text-sm text-muted-foreground border-l border-border pl-2">{user.officialName}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
