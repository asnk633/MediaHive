import { DriveFile } from '@/types/file';
import { FileIcon, FileText, Image as ImageIcon, Video, MoreVertical, Download, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FileCardProps {
    file: DriveFile;
    canEdit: boolean;
    onDelete: (id: string) => void;
}

export function FileCard({ file, canEdit, onDelete }: FileCardProps) {
    const Icon = getFileIcon(file.mimeType);

    return (
        <div className="group relative bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/10 transition-all duration-300 shadow-[0px_4px_20px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between relative z-40">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shadow-inner">
                    <Icon size={24} />
                </div>
                {canEdit && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(file.id);
                        }}
                        className="p-2 bg-white/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all hover:scale-110 z-50 relative cursor-pointer pointer-events-auto"
                        title="Move to Archives"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 relative z-10">
                <h3 className="font-semibold text-white truncate text-[15px] tracking-tight" title={file.name}>{file.name}</h3>
                <div className="flex flex-col gap-0.5 mt-1.5">
                    <p className="text-xs text-gray-400 font-medium">
                        {format(file.createdAt?.seconds ? new Date(file.createdAt.seconds * 1000) : new Date(), 'MMM d, yyyy')}
                    </p>
                    <p className="text-[10px] text-gray-500 opacity-60 uppercase tracking-wider font-bold">
                        {file.uploadedByName || 'Unknown'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5 relative z-10">
                <a
                    href={file.viewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                    <Eye size={14} /> View
                </a>
                <a
                    href={file.downloadLink}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                    <Download size={14} /> Download
                </a>
            </div>

            {/* Admin Visibility Badge */}
            {/* Admin Visibility Badge */}
            {(file.visibility.mode !== 'all' && canEdit) && (
                <div className="absolute top-0 right-0 rounded-bl-xl px-2 py-1 text-[9px] bg-amber-500/20 text-amber-500 font-bold uppercase tracking-widest border-b border-l border-amber-500/10 z-0">
                    {file.visibility.mode}
                </div>
            )}
        </div>
    );
}

function getFileIcon(mimeType: string) {
    if (!mimeType) return FileIcon;
    if (mimeType.includes('image')) return ImageIcon;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('video')) return Video;
    return FileIcon;
}
