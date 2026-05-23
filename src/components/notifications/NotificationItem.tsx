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
    // Selection props â€” optional; forwarded from NotificationInbox
    selectable?: boolean;
    selected?: boolean;
    onSelectToggle?: (e: React.MouseEvent) => void;
}

export function NotificationItem({
    notification,
    onRead,
    onArchive,
    selectable = false,
    selected = false,
    onSelectToggle,
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
        if (!type || typeof type !== 'string') {
            return <Info className="w-5 h-5 text-blue-500" />;
        }

        const lowerType = type.toLowerCase();
        if (lowerType.includes('overdue')) return <AlertTriangle className="w-5 h-5 text-red-500" />;
        if (lowerType.includes('warning') || lowerType.includes('reminder')) return <Bell className="w-5 h-5 text-yellow-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
    };


    return (
        <DataRow
            selectable={selectable}
            selected={selected}
            onSelectToggle={onSelectToggle}
            onClick={() => !read && onRead(id)}
            className="relative group rounded-xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-all duration-200 cursor-pointer"
        >
            {/* Priority Accent Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${priorityAccent[priority] ?? 'bg-blue-500'}`} />

            <div className={`flex gap-4 pl-3 flex-1 min-w-0 ${read ? 'opacity-90' : 'opacity-100'}`}>
                {/* Icon Column */}
                <div className="mt-1 flex-shrink-0">
                    {getTypeIcon()}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className={`text-sm truncate ${read ? 'text-foreground/80 font-semibold' : 'text-foreground font-bold'}`}>
                            {title}
                        </h4>
                        <span className="text-xs text-foreground/75 whitespace-nowrap ml-2">
                            {timeAgo}
                        </span>
                    </div>

                    <p className={`text-sm mt-1 break-words line-clamp-2 ${read ? 'text-foreground/75' : 'text-foreground/95'}`}>
                        {message}
                    </p>

                    {/* Action Row */}
                    <div className="flex items-center gap-3 mt-3">
                        {action_url && (
                            <Link
                                href={action_url}
                                onClick={() => !read && onRead(id)}
                                className="inline-flex items-center text-xs font-medium text-primary hover:opacity-80 transition-colors"
                            >
                                View Details <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                        )}

                        <div className="flex-1" />

                        {!read && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRead(id); }}
                                className="p-1 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-green-400 transition-colors"
                                title="Mark as Read"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onArchive(id); }}
                            className="p-1 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                            title="Delete"
                        >
                            <Archive className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </DataRow>
    );
}
