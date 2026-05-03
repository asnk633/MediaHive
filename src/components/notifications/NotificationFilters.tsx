import { NotificationFilterState } from '@/lib/notificationSelectors';
import { NotificationPriority, NotificationType } from '@/types/notification';
import { Filter, X } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, AtSign, RefreshCw, Clock } from 'lucide-react';

interface NotificationFiltersProps {
    filters: NotificationFilterState;
    onChange: (filters: NotificationFilterState) => void;
    onClear: () => void;
}

export function NotificationFilters({ filters, onChange, onClear }: NotificationFiltersProps) {

    const updateFilter = (key: keyof NotificationFilterState, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    return (
        <Surface className="sticky top-4 h-fit p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Filter className="w-5 h-5" /> Filters
                </h2>
                {(filters.priority !== 'all' || filters.type !== 'all' || filters.status !== 'all') && (
                    <button
                        onClick={onClear}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            <div className="space-y-6">

                {/* Status Filter */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                        Status
                    </label>
                    <div className="space-y-2">
                        {['all', 'unread', 'read'].map((status) => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="status"
                                    checked={filters.status === status}
                                    onChange={() => updateFilter('status', status)}
                                    className="rounded-full text-blue-500 focus:ring-blue-500 bg-white/5 border-white/10"
                                />
                                <span className="text-sm capitalize text-gray-300 group-hover:text-white transition-colors">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Priority Filter */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                        Priority
                    </label>
                    <div className="space-y-2">
                        {['all', 'high', 'medium', 'low'].map((p) => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="priority"
                                    checked={filters.priority === p}
                                    onChange={() => updateFilter('priority', p)}
                                    className="rounded-full text-blue-500 focus:ring-blue-500 bg-white/5 border-white/10"
                                />
                                <span className="text-sm capitalize text-gray-300 group-hover:text-white transition-colors">{p}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Type Filter */}
                <div>
                    <DropdownSelector 
                        label="Notification Type"
                        value={filters.type}
                        onChange={(val) => updateFilter('type', val)}
                        options={[
                            { id: 'all', label: 'All Types', icon: <Bell size={14} /> },
                            { id: 'task_assigned', label: 'Assignments', icon: <CheckCircle2 size={14} /> },
                            { id: 'due_reminder', label: 'Due Reminders', icon: <Clock size={14} className="text-yellow-400" /> },
                            { id: 'task_overdue', label: 'Overdue Alerts', icon: <AlertCircle size={14} className="text-red-400" /> },
                            { id: 'mention', label: 'Mentions', icon: <AtSign size={14} className="text-blue-400" /> },
                            { id: 'system_update', label: 'System Updates', icon: <RefreshCw size={14} /> },
                        ]}
                    />
                </div>

            </div>
        </Surface>
    );
}
