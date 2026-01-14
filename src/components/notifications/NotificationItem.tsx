import React from 'react';
import { AppNotification } from '@/types/notification';
import {
    Bell,
    CheckCircle,
    Clock,
    AlertTriangle,
    FileText,
    Calendar,
    Megaphone,
    User,
    Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
    notification: AppNotification;
    onClick: (notification: AppNotification) => void;
}

const getIcon = (notification: AppNotification) => {
    switch (notification.type) {
        case 'task_assigned': return <User size={18} className="text-blue-400" />;
        case 'task_completed': return <CheckCircle size={18} className="text-green-400" />;
        case 'priority_updated': return <AlertTriangle size={18} className="text-orange-400" />;
        case 'due_reminder': return <Clock size={18} className="text-red-400" />;
        case 'event_created': return <Calendar size={18} className="text-purple-400" />;
        case 'event_reminder': return <Clock size={18} className="text-purple-400" />;
        case 'announcement': return <Megaphone size={18} className="text-yellow-400" />;
        case 'system_update': {
            // Severity Color Logic
            const severity = notification.metadata?.severity || 'info';
            // Or look at priority: critical -> high
            const colorClass = notification.priority === 'high' ? 'text-red-500'
                : notification.metadata?.severity === 'important' ? 'text-orange-400'
                    : 'text-blue-400';

            return <Megaphone size={18} className={colorClass} />;
        }
        default: return <Bell size={18} className="text-gray-400" />;
    }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
    return (
        <div
            onClick={() => onClick(notification)}
            className={`
        flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 group
        ${notification.isRead ? 'opacity-60 hover:opacity-100 hover:bg-white/5' : 'bg-blue-500/5 hover:bg-blue-500/10'}
      `}
        >
            <div className={`mt-1 flex-shrink-0 p-1.5 rounded-lg ${notification.isRead ? 'bg-white/5' : 'bg-white/10'}`}>
                {getIcon(notification)}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${notification.isRead ? 'text-gray-400' : 'text-gray-100'}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {notification.message}
                </p>
                <p className="text-[10px] text-gray-600 mt-2 font-medium uppercase tracking-wider flex items-center gap-1">
                    {(() => {
                        const date = notification.createdAt;
                        if (!date) return 'Just now';
                        if (typeof date === 'string' || typeof date === 'number') {
                            return formatDistanceToNow(new Date(date), { addSuffix: true });
                        }
                        if ('seconds' in date) {
                            return formatDistanceToNow(new Date(date.seconds * 1000), { addSuffix: true });
                        }
                        return 'Just now';
                    })()}
                </p>
            </div>
            {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
            )}
        </div>
    );
};
