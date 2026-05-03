"use client";
import React from 'react';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { DriveFile } from '@/types/file';

// Dynamically import MediaLightbox without lazy loading for static export compatibility
import MediaLightbox from './MediaLightbox';

interface LazyMediaLightboxProps {
  file: ExtendedDriveFile;
  files: DriveFile[];
  loading?: boolean;
  onClose: () => void;
  onNavigate: (file: DriveFile) => void;
}

export function LazyMediaLightbox({ file, files, loading = false, onClose, onNavigate }: LazyMediaLightboxProps) {
  return (
    <MediaLightbox 
      file={file} 
      files={files} 
      loading={loading}
      onClose={onClose} 
      onNavigate={onNavigate} 
    />
  );
}
