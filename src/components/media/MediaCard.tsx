import React from 'react';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { FileText, Image as ImageIcon, Video, Play, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import { getDriveImageUrl } from '@/lib/driveUtils';

interface MediaCardProps {
  file: ExtendedDriveFile;
  onClick: () => void;
}
export function MediaCard({ file, onClick }: MediaCardProps) {
  const getFileIcon = (mimeType: string = '') => {
    if (mimeType?.startsWith('image/')) {
      return ImageIcon;
    } else if (mimeType?.startsWith('video/')) {
      return Video;
    } else {
      return FileText;
    }
  };

  const isImage = file.mimeType?.startsWith('image/') || false;
  const isVideo = file.mimeType?.startsWith('video/') || false;
  const isPdf = file.mimeType === 'application/pdf';

  // Get file extension for display
  const getFileExtension = (file_name: string) => {
    return file_name.split('.').pop()?.toUpperCase() || '';
  };

  const [imgError, setImgError] = React.useState(false);

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Get context icon based on file associations (simplified for now)
  const getContextIcon = () => {
    // In a full implementation, this would check if the file is associated with a task or event
    // For now, we'll just show a generic context icon
    return Calendar; // Default to Calendar, but could be Task or Event specific
  };

  const ContextIcon = getContextIcon();
  const FileIcon = getFileIcon(file.mimeType);

  return (
    <div
      className="group relative aspect-video rounded-xl overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
      onClick={onClick}
    >
      {/* Thumbnail or Icon */}
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-surface)] relative">
        {(isImage || isVideo || isPdf) && !imgError ? (
          // For images, videos, and PDFs, show a thumbnail preview
          <div className="w-full h-full relative">
            <Image
              src={`/api/drive/image/${file.driveFileId}?thumbnail=true`}
              alt={file.name}
              fill
              unoptimized={true} // Google thumbnails are pre-optimized and don't need Next.js re-processing
              sizes="(max-width: 640px) 100vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => {
                setImgError(true);
              }}
            />
            {/* Play overlay for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                <div className="bg-black/50 rounded-full p-3 group-hover:bg-indigo-500/80 transition-colors">
                  <Play size={20} className="text-white fill-white" />
                </div>
              </div>
            )}
            {/* PDF Badge/Overlay like WhatsApp */}
            {isPdf && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded-md shadow-lg border border-red-500/50 z-10">
                  <FileText size={12} className="text-white" />
                  <span className="text-[10px] font-bold text-white uppercase">PDF</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileText size={24} className="text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
          </div>
        ) : (
          // Fallback or other file types, show file type icon
          <div className="w-full h-full flex flex-col items-center justify-center p-2">
            <div className={`p-4 rounded-xl mb-2 transition-colors ${isPdf ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <div className="relative">
                <FileIcon size={32} strokeWidth={1.5} />
                {isPdf && (
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-600 rounded text-[8px] font-bold text-white shadow-sm">
                    PDF
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
              {getFileExtension(file.name)}
            </span>
          </div>
        )}
      </div>

      {/* Overlay Metadata */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
        <div className="flex justify-between items-start">
          <h3 className="text-white text-sm font-medium truncate flex-1 mr-2">
            {file.name}
          </h3>
          <div className="flex items-center gap-1">
            {/* Context icon */}
            <div className="p-1 rounded bg-black/30">
              <ContextIcon size={14} className="text-white" />
            </div>

            {/* Version badge */}
            {file.versionNumber && (
              <div className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-xs font-medium">
                V{file.versionNumber}
              </div>
            )}

            {/* Video duration badge (if applicable) */}
            {isVideo && (
              <div className="px-1.5 py-0.5 rounded bg-black/50 text-white text-xs font-medium">
                0:00
              </div>
            )}
          </div>
        </div>
        <div className="text-white/80 text-xs mt-1">
          {formatDate(file.created_at)}
        </div>
      </div>
      {/* Always visible file name at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
        <h3 className="text-white text-sm font-medium truncate">
          {file.name}
        </h3>
      </div>
    </div>
  );
}
