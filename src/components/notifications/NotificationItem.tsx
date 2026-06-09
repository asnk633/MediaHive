// @ts-nocheck
import React from 'react';
import { AppNotification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { Check, Archive, ExternalLink, Bell, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { DataRow } from '@/components/ui/DataRow';

interface NotificationItemProps {
    notification: AppNotification;
    onRead: (id: string) => void;
    onArchive: (id: string) => void;
    // Selection props — optional; forwarded from NotificationInbox
    selectable?: boolean;
    selected?: boolean;
    onSelectToggle?: (e: React.MouseEvent) => void;
    variant?: 'flat' | 'card';
}

export function NotificationItem({
    notification,
    onRead,
    onArchive,
    selectable = false,
    selected = false,
    onSelectToggle,
    variant = 'card',
}: NotificationItemProps) {
    const { id, title, message, priority, read, created_at, type, action_url } = notification;

    // Format Date
    let dateObj: Date;
    if (created_at && typeof created_at === 'object' && 'seconds' in created_at) {
        dateObj = new Date(created_at.seconds * 1000);
    } else if (created_at instanceof Date) {
        dateObj = created_at;
    } else {
        dateObj = new Date(created_at as string | number);
    }

    const timeAgo = formatDistanceToNow(dateObj, { addSuffix: true });

    // Priority Accent Colors
    const priorityAccent: Record<string, string> = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-blue-500',
    };

    // Type Icons
    const getTypeIcon = () => {
        const lowerType = (type || '').toLowerCase();
        let icon = <Info className="w-4 h-4 text-indigo-500" />;
        let bg = 'bg-indigo-500/10 border-indigo-500/15';

        if (lowerType.includes('overdue')) {
            icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
            bg = 'bg-red-500/10 border-red-500/15';
        } else if (lowerType.includes('warning') || lowerType.includes('reminder')) {
            icon = <Bell className="w-4 h-4 text-amber-500" />;
            bg = 'bg-amber-500/10 border-amber-500/15';
        }

        return (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bg} flex-shrink-0`}>
                {icon}
            </div>
        );
    };

    const isCard = variant === 'card';
    const containerClasses = isCard 
        ? "relative group rounded-xl border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all duration-200 cursor-pointer !h-auto !py-3 !px-4"
        : "relative group bg-transparent transition-all duration-150 cursor-pointer !h-auto !py-3 !px-4 border-b border-border last:border-none hover:bg-foreground/[0.01]";

    return (
        <DataRow
            selectable={selectable}
            selected={selected}
            onSelectToggle={onSelectToggle}
            onClick={() => !read && onRead(id)}
            className={containerClasses}
        >
            {/* Priority Accent Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${priorityAccent[priority] ?? 'bg-blue-500'}`} />

            <div className={`flex gap-3 pl-2.5 flex-1 min-w-0 ${read ? 'opacity-80' : 'opacity-100'}`}>
                {/* Icon Column */}
                <div className="mt-0.5 flex-shrink-0">
                    {getTypeIcon()}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className={`text-sm truncate ${read ? 'text-foreground/75 font-semibold' : 'text-foreground font-bold'}`}>
                                {title}
                            </h4>
                            {action_url && <ExternalLink className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-foreground/50 font-medium whitespace-nowrap">
                                {timeAgo}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                {!read && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRead(id); }}
                                        className="p-1 rounded-md hover:bg-foreground/10 text-foreground/60 hover:text-emerald-500 transition-colors h-6 w-6 flex items-center justify-center"
                                        title="Mark as Read"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onArchive(id); }}
                                    className="p-1 rounded-md hover:bg-foreground/10 text-foreground/60 hover:text-rose-500 transition-colors h-6 w-6 flex items-center justify-center"
                                    title="Delete"
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className={`text-xs mt-1 break-words line-clamp-2 leading-relaxed ${read ? 'text-foreground/65' : 'text-foreground/85'}`}>
                        {message}
                    </p>
                </div>
            </div>
        </DataRow>
    );
}
