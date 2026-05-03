import { AppNotification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { DateGroup, GroupedNotifications } from '@/lib/notificationSelectors';

interface NotificationGroupProps {
    group: GroupedNotifications;
    onRead: (id: string) => void;
    onArchive: (id: string) => void;
}

export function NotificationGroup({ group, onRead, onArchive }: NotificationGroupProps) {
    return (
        <div className="mb-8">
            {/* Divider-style Header */}
            <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="uppercase text-xs tracking-wide text-gray-500 font-medium">
                    {group.group}
                </span>
                <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="space-y-3">
                {group.items.map(notification => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={onRead}
                        onArchive={onArchive}
                    />
                ))}
            </div>
        </div>
    );
}
