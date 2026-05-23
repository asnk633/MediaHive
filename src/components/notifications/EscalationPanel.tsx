import { AppNotification } from '@/types/notification';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Clock, Package } from 'lucide-react';
import Link from 'next/link';

interface EscalationPanelProps {
    notifications: AppNotification[];
}

export function EscalationPanel({ notifications }: EscalationPanelProps) {
    const { user } = useAuth();

    // 1. Admin Check
    if (user?.role !== 'admin') return null;

    // 2. Compute Counts (In-memory derived state)
    const stats = {
        overdue: notifications.filter(n => n.type === 'task_overdue' && !n.read).length,
        stale: notifications.filter(n => n.type === 'stale_task_escalation' && !n.read).length,
        inventory: notifications.filter(n => n.type?.includes('inventory_escalated') && !n.read).length,
    };

    // 3. Hide if empty
    if (stats.overdue === 0 && stats.stale === 0 && stats.inventory === 0) return null;

    return (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-red-700 dark:text-red-300">
                    Escalated Items
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.overdue > 0 && (
                    <div className="bg-foreground/5 p-3 rounded-lg border border-foreground/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-foreground/85">Overdue Tasks</span>
                        </div>
                        <span className="bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-1 rounded-full">
                            {stats.overdue}
                        </span>
                    </div>
                )}

                {stats.stale > 0 && (
                    <div className="bg-foreground/5 p-3 rounded-lg border border-foreground/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-semibold text-foreground/85">Stale Tasks</span>
                        </div>
                        <span className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-full">
                            {stats.stale}
                        </span>
                    </div>
                )}

                {stats.inventory > 0 && (
                    <div className="bg-foreground/5 p-3 rounded-lg border border-foreground/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-semibold text-foreground/85">Inventory Alerts</span>
                        </div>
                        <span className="bg-yellow-500/20 text-amber-800 dark:text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                            {stats.inventory}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-end">
                <Link
                    href="/tasks?filter=overdue"
                    className="text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors text-red-700 dark:text-red-300 font-semibold"
                >
                    View Overdue Tasks →
                </Link>
            </div>
        </div>
    );
}
