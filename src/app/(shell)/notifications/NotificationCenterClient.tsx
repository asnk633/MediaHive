"use client";

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
    NotificationFilterState,
    filterNotifications,
    groupNotificationsByDate,
    sortNotifications
} from '@/lib/notificationSelectors';
import { AppNotification } from '@/types/notification';
import { AlertService } from '@/services/alertService';
import {
    CheckCheck,
    Loader2,
    Search,
    SortAsc,
    SortDesc,
    ArrowUpNarrowWide,
    Bell
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { EscalationPanel } from '@/components/notifications/EscalationPanel';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';
import { NotificationGroup } from '@/components/notifications/NotificationGroup';
import { useRouter } from 'next/navigation';
import { Surface } from '@/components/ui/Surface';

export default function NotificationCenterClient() {
    const { user } = useAuth();
    const { notifications, loading, setNotifications } = useNotifications(user?.uid || null);
    const router = useRouter();

    // --- State ---
    const [filters, setFilters] = useState<NotificationFilterState>({
        priority: 'all',
        type: 'all',
        status: 'unread', // Default to actionable items
        search: '',
    });

    const [sortMode, setSortMode] = useState<'priority' | 'newest' | 'oldest'>('priority');

    // --- Derived Data ---
    const processedNotifications = useMemo(() => {
        if (!notifications) return [];

        // 1. Filter
        const filtered = filterNotifications(notifications, filters);

        // 2. Sort
        const sorted = sortNotifications(filtered, sortMode);

        return sorted;
    }, [notifications, filters, sortMode]);

    const groupedNotifications = useMemo(() => {
        return groupNotificationsByDate(processedNotifications);
    }, [processedNotifications]);

    // --- Actions ---

    const handleRead = async (id: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
            await AlertService.markAsRead(id);
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const handleArchive = async (id: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));
            await AlertService.archiveNotification(id);
        } catch (error) {
            console.error("Error archiving:", error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;

        const unreadIds = processedNotifications
            .filter(n => !n.read)
            .map(n => n.id);

        if (unreadIds.length === 0) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            await AlertService.markAllAsRead();
        } catch (error) {
            console.error("Error batch marking read:", error);
        }
    };

    // --- Render ---

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="px-10 py-10">

            {/* Admin Escalation Banner (Top) */}
            {user?.role === 'admin' && (
                <div className="mb-8">
                    <EscalationPanel notifications={notifications || []} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

                {/* Left Sidebar: Filters */}
                <aside className="w-full flex-shrink-0">
                    <div className="sticky top-24">
                        <NotificationFilters
                            filters={filters}
                            onChange={setFilters}
                            onClear={() => setFilters({ priority: 'all', type: 'all', status: 'all', search: '' })}
                        />
                    </div>
                </aside>

                {/* Right Column: Feed */}
                <main className="flex-1 min-w-0 max-w-[1280px]">
                    {/* Embedded Content Container */}
                    <Surface className="p-6">

                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-semibold text-white tracking-tight">
                                    Notification Center
                                </h1>
                                <p className="text-sm text-gray-400 mt-1">
                                    {processedNotifications.length} {filters.status === 'unread' ? 'unread' : ''} messages
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="pl-9 pr-4 py-2 text-sm border border-white/10 rounded-lg w-full sm:w-64 bg-white/5 text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-2 border border-white/10 rounded-lg p-1 bg-white/5">
                                    <button
                                        onClick={() => setSortMode('priority')}
                                        className={`p-1.5 rounded transition-colors ${sortMode === 'priority' ? 'bg-white/10 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                                        title="Sort by Priority"
                                    >
                                        <ArrowUpNarrowWide className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setSortMode('newest')}
                                        className={`p-1.5 rounded transition-colors ${sortMode === 'newest' ? 'bg-white/10 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                                        title="Newest First"
                                    >
                                        <SortDesc className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setSortMode('oldest')}
                                        className={`p-1.5 rounded transition-colors ${sortMode === 'oldest' ? 'bg-white/10 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                                        title="Oldest First"
                                    >
                                        <SortAsc className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Mark All Read */}
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={processedNotifications.filter(n => !n.read).length === 0}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline">Mark All Read</span>
                                </button>
                            </div>
                        </div>

                        {/* Feed Content */}
                        <div className="space-y-4">
                            {groupedNotifications.length > 0 ? (
                                groupedNotifications.map((group) => (
                                    <NotificationGroup
                                        key={group.group}
                                        group={group}
                                        onRead={handleRead}
                                        onArchive={handleArchive}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Bell className="w-12 h-12 text-gray-500 mb-4" />
                                    <p className="text-gray-400 text-lg">You're all caught up.</p>
                                    {filters.status !== 'all' && (
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                                            className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            View all notifications
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </Surface>
                </main>
            </div>
        </div>
    );
}
