import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Film, Download, ExternalLink } from 'lucide-react';

interface SafeDeliverablePreviewProps {
    url: string;
    fileName: string;
    fileType: string;
    className?: string;
}

export const SafeDeliverablePreview: React.FC<SafeDeliverablePreviewProps> = ({
    url,
    fileName,
    fileType,
    className = ''
}) => {
    const [imageError, setImageError] = useState(false);
    const isImage = fileType.startsWith('image/') && !imageError;
    const isVideo = fileType.startsWith('video/');

    if (isImage) {
        return (
            <div className={`relative group rounded-lg overflow-hidden bg-black/20 border border-[#ffffff1a] ${className}`}>
                <img
                    src={url}
                    alt={fileName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                        title="Open full size"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        );
    }

    if (isVideo) {
        return (
            <div className={`relative rounded-lg overflow-hidden bg-black/40 border border-[#ffffff1a] flex items-center justify-center ${className}`}>
                <video
                    src={url}
                    className="w-full h-full object-contain"
                    controls={false} // Don't show controls in preview, just a thumbnail roughly
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Film size={24} className="text-white/70" />
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    title="Play Video"
                />
            </div>
        );
    }

    // Generic File Fallback
    return (
        <div className={`flex flex-col items-center justify-center p-4 bg-white/5 border border-[#ffffff1a] rounded-lg ${className}`}>
            <div className="p-3 bg-white/5 rounded-full mb-2">
                <FileText size={24} className="text-blue-400" />
            </div>
            <span className="text-xs text-center text-gray-400 font-medium truncate w-full px-2" title={fileName}>
                {fileName}
            </span>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-wider"
            >
                <Download size={10} /> Download
            </a>
        </div>
    );
};
