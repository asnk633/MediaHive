import React, { useEffect, useState } from 'react';
import { Deliverable } from '@/types/deliverable';
import { DeliverableService } from '@/services/deliverableService';
import { SafeDeliverablePreview } from './SafeDeliverablePreview';
import { formatDistanceToNow } from 'date-fns';
import { Download, FileText, Clock, User as UserIcon } from 'lucide-react';
import { SafeAvatar } from '@/components/ui/SafeAvatar';

interface DeliverablesListProps {
    taskId: string;
    refreshTrigger?: number; // Prop to force refresh when new file uploaded
}

export const DeliverablesList: React.FC<DeliverablesListProps> = ({ taskId, refreshTrigger }) => {
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDeliverables();
    }, [taskId, refreshTrigger]);

    const loadDeliverables = async () => {
        setLoading(true);
        const data = await DeliverableService.getDeliverables(taskId);
        setDeliverables(data);
        setLoading(false);
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500 text-xs">Loading deliverables...</div>;
    }

    if (deliverables.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-[#ffffff1a] rounded-xl bg-foreground/5">
                <FileText className="text-gray-500 mb-2" size={24} />
                <p className="text-sm text-gray-400 font-medium">No deliverables yet</p>
                <p className="text-xs text-gray-500 mt-1">Upload a file to complete this task</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {deliverables.map((item, index) => {
                const isLatest = index === 0;
                return (
                    <div
                        key={item.id}
                        className={`
                            relative rounded-xl border p-4 transition-all
                            ${isLatest
                                ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-900/10'
                                : 'bg-foreground/5 border-[#ffffff1a] opacity-70 hover:opacity-100'
                            }
                        `}
                    >
                        {isLatest && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-blue-400">
                                LATEST
                            </div>
                        )}

                        <div className="flex gap-4">
                            {/* Preview Thumbnail */}
                            <SafeDeliverablePreview
                                url={item.downloadUrl}
                                file_name={item.file_name}
                                fileType={item.fileType}
                                className="w-24 h-24 shrink-0"
                            />

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-200 truncate" title={item.file_name}>
                                        {item.file_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-mono text-gray-500 bg-black/20 px-1.5 rounded">
                                            v{item.version}
                                        </span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                        <SafeAvatar
                                            src={item.uploaded_by.avatar_url}
                                            alt={item.uploaded_by.name}
                                            size={20}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-300 font-medium">{item.uploaded_by.name}</span>
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Clock size={8} />
                                                {formatDistanceToNow(
                                                    (item.created_at as any).toDate ? (item.created_at as any).toDate() : item.created_at,
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <a
                                        href={item.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-blue-400 transition-colors border border-foreground/5"
                                        title="Download / Open"
                                    >
                                        <Download size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
