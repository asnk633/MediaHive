import React from 'react';
import { FileStats } from '@/services/reportService';
import { FileText, ExternalLink, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
    data: FileStats;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ data }) => {
    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-[20px] border border-white/5 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Files (7 Days)</p>
                    <p className="text-3xl font-display font-bold text-white mt-2">{data.uploadedLast7Days}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-[20px] border border-white/5 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Files (30 Days)</p>
                    <p className="text-3xl font-display font-bold text-white mt-2">{data.uploadedLast30Days}</p>
                </div>
            </div>

            {/* Recent List */}
            <div className="bg-white/5 backdrop-blur-md rounded-[20px] border border-white/5 overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.2)]">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <FileText size={18} className="text-blue-400" /> Recent Uploads
                    </h3>
                </div>
                <div className="divide-y divide-white/5">
                    {data.recentFiles.length > 0 ? (
                        data.recentFiles.map((file) => (
                            <div key={file.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-200 truncate max-w-[150px] md:max-w-xs group-hover:text-white transition-colors">{file.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            {file.created_at
                                                ? formatDistanceToNow(file.created_at.seconds ? new Date(file.created_at.seconds * 1000) : new Date(file.created_at), { addSuffix: true })
                                                : 'Unknown date'}
                                        </p>
                                    </div>
                                </div>
                                {file.viewLink && (
                                    <a
                                        href={file.viewLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-400/10 px-3 py-1.5 rounded-full hover:bg-blue-400/20 transition-colors"
                                    >
                                        View <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">No recent files found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
