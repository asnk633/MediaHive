"use client";

import React, { useState } from "react";
import { FileText, Image as ImageIcon, File, Download, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type FileItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  category: 'document' | 'image' | 'archive' | 'other';
};

const MOCK_FILES: FileItem[] = [
  { id: '1', name: 'Brand_Guidelines_2024.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 'Admin', date: '2024-05-12', category: 'document' },
  { id: '2', name: 'Logo_Pack_Final.zip', type: 'ZIP', size: '15.8 MB', uploadedBy: 'Design Team', date: '2024-05-10', category: 'archive' },
  { id: '3', name: 'Social_Media_Post_Template.psd', type: 'PSD', size: '45.2 MB', uploadedBy: 'Alex', date: '2024-05-08', category: 'image' },
  { id: '4', name: 'Q2_Report_Draft.docx', type: 'DOCX', size: '1.2 MB', uploadedBy: 'Sarah', date: '2024-05-05', category: 'document' },
  { id: '5', name: 'Event_Banner_v2.png', type: 'PNG', size: '3.5 MB', uploadedBy: 'Design Team', date: '2024-05-01', category: 'image' },
];

export default function DownloadsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = MOCK_FILES.filter(file => {
    const matchesCategory = activeCategory === 'all' || file.category === activeCategory;
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 px-2 pt-4 pb-24">
      <header className="px-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Files</h1>
        <p className="mt-1 text-gray-400">Access shared resources and documents.</p>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <CategoryChip label="All" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          <CategoryChip label="Documents" active={activeCategory === 'document'} onClick={() => setActiveCategory('document')} />
          <CategoryChip label="Images" active={activeCategory === 'image'} onClick={() => setActiveCategory('image')} />
          <CategoryChip label="Archives" active={activeCategory === 'archive'} onClick={() => setActiveCategory('archive')} />
        </div>
      </div>

      {/* File List */}
      <div className="grid gap-3">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="glass-card flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                <FileIcon type={file.type} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{file.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="uppercase">{file.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                  <span>{file.size}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-700" />
                  <span>{file.uploadedBy}</span>
                </div>
              </div>

              {/* Download Button */}
              <button className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <Download size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            No files found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
        active
          ? "bg-blue-600 text-white border-blue-500 shadow-glow"
          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function FileIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes('pdf') || t.includes('doc') || t.includes('txt')) return <FileText size={20} />;
  if (t.includes('png') || t.includes('jpg') || t.includes('psd')) return <ImageIcon size={20} />;
  if (t.includes('zip') || t.includes('rar')) return <File size={20} />;
  return <File size={20} />;
}
