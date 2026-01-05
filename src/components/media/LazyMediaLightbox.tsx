import React, { lazy, Suspense } from 'react';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { DriveFile } from '@/types/file';
import { Skeleton } from '@/components/ui/skeleton';

const LazyLoadedMediaLightbox = lazy(() => import('./MediaLightbox'));

interface LazyMediaLightboxProps {
  file: ExtendedDriveFile;
  files: DriveFile[];
  loading?: boolean;
  onClose: () => void;
  onNavigate: (file: DriveFile) => void;
}

export function LazyMediaLightbox({ file, files, loading = false, onClose, onNavigate }: LazyMediaLightboxProps) {
  return (
    <Suspense 
      fallback={
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white">
            <div className="w-6 h-6 bg-gray-500 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col md:flex-row w-full max-w-6xl max-h-[90vh] bg-[var(--bg-panel)] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex-1 flex items-center justify-center relative bg-black">
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full max-h-[70vh] flex items-center justify-center animate-pulse">
                  <div className="text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-80 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-[var(--border-subtle)]">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LazyLoadedMediaLightbox 
        file={file} 
        files={files} 
        loading={loading}
        onClose={onClose} 
        onNavigate={onNavigate} 
      />
    </Suspense>
  );
}