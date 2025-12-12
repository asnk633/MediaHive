import React from 'react';
import { Download, File, Folder } from 'lucide-react';

export default function DownloadsPage() {
  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-4xl mx-auto">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Downloads</h1>
        <p className="text-[var(--color-text-secondary)]">Access shared resources and media.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-[var(--color-bg-surface)] rounded-[20px] border border-[var(--color-border)] flex flex-col items-center justify-center gap-3 p-4 hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer">
            <Folder size={32} className="text-blue-400" />
            <span className="text-white font-medium text-sm">Media Pack {i}</span>
          </div>
        ))}
        {[1, 2].map((i) => (
          <div key={`f-${i}`} className="aspect-square bg-[var(--color-bg-surface)] rounded-[20px] border border-[var(--color-border)] flex flex-col items-center justify-center gap-3 p-4 hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer">
            <File size={32} className="text-[var(--color-text-secondary)]" />
            <span className="text-white font-medium text-sm">Document.pdf</span>
          </div>
        ))}
      </div>
    </div>
  );
}