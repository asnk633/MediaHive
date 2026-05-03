import React from 'react';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { MediaCard } from './MediaCard';
import { isFeatureEnabled } from '@/app/featureFlags';

interface MediaGalleryGridProps {
  files: ExtendedDriveFile[];
  loading: boolean;
  onFileSelect: (file: ExtendedDriveFile) => void;
}
export function MediaGalleryGrid({ files, loading, onFileSelect }: MediaGalleryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-video rounded-xl bg-[var(--bg-panel)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] border-dashed">
        <div className="text-5xl mb-4">📸</div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">No media files found</h3>
        <p className="text-[var(--text-secondary)]">
          {isFeatureEnabled('onboardingLayer') 
            ? 'Upload media to start review and collaboration' 
            : 'Upload media files to see them appear in the gallery'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {files.map(file => (
        <MediaCard
          key={file.id}
          file={file}
          onClick={() => onFileSelect(file)}
        />
      ))}
    </div>
  );
}
