"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, Sparkles, Folder, Play, CheckCircle2, Pause, 
  ArrowDownToLine, RefreshCw, Loader2, List, Grid, Eye, 
  FileText, Image as ImageIcon, Video, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import TiltedCard from "@/components/TiltedCard";
import { AnimatedList } from "@/components/ui/animated-list";
import { getDriveImageUrl } from "@/lib/driveUtils";

// Modular Grid Card component with multi-stage fallback array
function FileGridCard({ file, formatSize, getFileIcon }: { file: any, formatSize: (b: number) => string, getFileIcon: (m: string) => any }) {
  const FileIcon = getFileIcon(file.mimeType);
  const isVideo = file.mimeType?.startsWith('video/') || false;

  // 1. Extension-less Image & File type Sniffing
  const isImageOrHasPreview = useMemo(() => {
    const mime = file.mimeType?.toLowerCase() || "";
    if (mime.startsWith("image/") || mime.startsWith("video/") || mime === "application/pdf") {
      return true;
    }
    const linkStr = `${file.downloadLink || ""} ${file.viewLink || ""} ${file.name || ""}`.toLowerCase();
    return linkStr.includes(".jpg") || linkStr.includes(".jpeg") || linkStr.includes(".png") || linkStr.includes(".webp") || linkStr.includes(".gif") || linkStr.includes(".mp4") || linkStr.includes(".pdf");
  }, [file]);

  // 2. Multi-stage Fallback Array (CRITICAL GUARDRAIL for Google Drive size limits)
  const fallbackUrls = useMemo(() => {
    const urls: string[] = [];
    if (!isImageOrHasPreview) return urls;

    // A. Vercel backend proxy URL
    if (file.driveFileId) {
      urls.push(`https://thaiba-garden-media-manager.vercel.app/api/drive/image/${file.driveFileId}?thumbnail=true`);
    }

    // B. Direct Google Drive thumbnail URL (client browser bypasses proxy block)
    if (file.driveFileId) {
      urls.push(`https://drive.google.com/thumbnail?id=${file.driveFileId}&sz=w600`);
    }

    // C. Direct export link
    if (file.driveFileId) {
      urls.push(`https://docs.google.com/uc?export=view&id=${file.driveFileId}`);
    }

    // D. Database preview Link / thumbnail link
    if (file.previewLink) {
      urls.push(file.previewLink);
    }

    // E. Database viewLink or downloadLink as absolute URLs if image format
    if (file.viewLink && file.viewLink.startsWith("http")) {
      urls.push(file.viewLink);
    }
    if (file.downloadLink && file.downloadLink.startsWith("http")) {
      urls.push(file.downloadLink);
    }

    return urls.filter(Boolean);
  }, [file, isImageOrHasPreview]);

  const [fallbackIndex, setFallbackIndex] = useState(0);
  const currentSrc = fallbackUrls[fallbackIndex];
  const hasImage = fallbackUrls.length > 0 && fallbackIndex < fallbackUrls.length;

  const handleImageError = () => {
    setFallbackIndex(prev => prev + 1);
  };

  return (
    <div className="h-[270px] w-full">
      <TiltedCard
        customContent={
          <div className="w-full h-full bg-zinc-900/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex flex-col justify-between backdrop-blur-md relative overflow-hidden group/card text-left">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 z-10">
              <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-white/5 text-[var(--accent)]">
                <FileIcon size={16} />
              </div>
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} />
                <span>Offline Ready</span>
              </span>
            </div>

            {/* Thumbnail Box with cascading fallbacks */}
            {hasImage && currentSrc ? (
              <div className="w-full h-24 rounded-xl overflow-hidden relative border border-white/5 mt-3 bg-zinc-950/40 z-10">
                <img
                  src={currentSrc}
                  alt={file.name}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover/card:scale-105"
                  onError={handleImageError}
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/card:bg-black/10 transition-colors">
                    <div className="bg-black/60 rounded-full p-2 text-white border border-white/10 group-hover/card:bg-[var(--accent)] group-hover/card:border-[var(--accent-hover)] transition-colors">
                      <Play size={12} className="fill-white" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-24 rounded-xl border border-white/5 border-dashed mt-3 bg-zinc-950/20 flex flex-col items-center justify-center text-zinc-600 z-10">
                <FileIcon size={24} className="opacity-40" />
                <span className="text-[8px] uppercase tracking-widest font-bold mt-1 text-zinc-500">
                  {file.name.split('.').pop() || 'File'}
                </span>
              </div>
            )}

            {/* Title & Metadata */}
            <div className="mt-3 z-10">
              <h4 className="text-xs font-bold text-zinc-200 truncate group-hover/card:text-white transition-colors" title={file.name}>
                {file.name}
              </h4>
              <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-1">
                <span>{formatSize(file.file_size)}</span>
                <span>{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 z-10">
              {file.viewLink && (
                <a
                  href={file.viewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold text-zinc-350 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Eye size={10} /> View
                </a>
              )}
              {file.downloadLink && (
                <a
                  href={file.downloadLink}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold text-[var(--accent)] bg-[var(--accent-wash)] hover:bg-[var(--accent)]/20 rounded-lg border border-[var(--accent)]/20 transition-colors"
                >
                  <Download size={10} /> Get File
                </a>
              )}
            </div>
          </div>
        }
        showTooltip={false}
        scaleOnHover={1.03}
        rotateAmplitude={8}
        containerHeight="100%"
        className="w-full h-full"
      />
    </div>
  );
}

export default function DownloadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [syncedFiles, setSyncedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "documents" | "photos" | "videos">("all");
  const activeDownload = null;

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Key Down Listener for search focus and view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search bar on '/'
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Switch views on 'g' or 'l'
      if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        if (e.key.toLowerCase() === "g") {
          setViewMode("grid");
        } else if (e.key.toLowerCase() === "l") {
          setViewMode("list");
        }
      }
      // Blur search bar on 'Escape'
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearch("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchFiles = async () => {
    if (!user) return;
    if (!user.institution_id && !user.tenant_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('files')
        .select('*')
        .not('name', 'ilike', 'INV_%')
        .order('created_at', { ascending: false });
        
      if (user.institution_id) {
        query = query.eq('institution_id', user.institution_id);
      } else if (user.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      }
        
      const { data } = await query;
      
      // Map properties standardizing snake_case to camelCase
      const mapped = (data || []).map((f: any) => ({
        ...f,
        mimeType: f.mime_type || f.mimeType,
        driveFileId: f.drive_file_id || f.driveFileId,
        viewLink: f.web_view_link || f.viewLink || f.webViewLink,
        downloadLink: f.download_link || f.downloadLink,
        previewLink: f.thumbnail_link || f.previewLink || f.preview_link,
        uploadedByName: f.uploaded_by_name || f.uploadedByName,
        uploadedByRole: f.uploaded_by_role || f.uploadedByRole,
        file_size: f.file_size || f.size || 0
      }));
      
      setSyncedFiles(mapped);
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user?.institution_id || user?.tenant_id)) {
      fetchFiles();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string = "") => {
    const mime = mimeType?.toLowerCase() || "";
    if (mime.startsWith("image/")) return ImageIcon;
    if (mime.startsWith("video/")) return Video;
    if (mime === "application/pdf") return FileText;
    return Folder;
  };

  // Filtered files logic
  const filteredFiles = useMemo(() => {
    let result = syncedFiles.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );

    if (category === 'photos') {
      result = result.filter(f => f.mimeType?.startsWith('image/'));
    } else if (category === 'videos') {
      result = result.filter(f => f.mimeType?.startsWith('video/'));
    } else if (category === 'documents') {
      result = result.filter(f => !f.mimeType?.startsWith('image/') && !f.mimeType?.startsWith('video/'));
    }

    return result;
  }, [syncedFiles, search, category]);

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Offline Manager
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Downloads</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Manage local asset cache synchronization, downloads queue, and offline data.
          </p>
        </div>

        <button onClick={fetchFiles} className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-zinc-950 text-sm font-semibold px-4 py-2 rounded-full active:scale-95 transition-all cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Syncing..." : "Sync Now"}</span>
        </button>
      </header>

      {/* 2. Active Download Progress card */}
      {activeDownload && (
        <div className="bg-zinc-900/20 border border-white/5 p-5 rounded-2xl backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Download Queue</span>
              <h3 className="text-sm font-bold text-zinc-200 mt-1 m-0">Asset B-Roll Pack v3.zip</h3>
            </div>
             <span className="text-xs font-semibold text-[var(--accent)]">45% Complete</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "45%" }}
              transition={{ duration: 1 }}
              className="h-full bg-[var(--accent)] rounded-full"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
            <span>850 MB of 2.1 GB • 2.4 MB/s</span>
            <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <Pause size={10} />
              <span>Pause Sync</span>
            </button>
          </div>
        </div>
      )}

      {/* Toolbar with Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Full-width Search bar with Key indicator */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search offline assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl pl-12 pr-12 py-3.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/8 text-[9px] font-mono text-zinc-500 pointer-events-none select-none">
            /
          </div>
        </div>

        {/* Filters and Layout Toggle Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-950/20 border border-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Assets' },
              { id: 'documents', label: 'Documents' },
              { id: 'photos', label: 'Photos' },
              { id: 'videos', label: 'Videos' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border border-transparent cursor-pointer ${
                  category === cat.id
                    ? "active-tab-capsule border border-[var(--accent)]/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* List / Grid Layout Toggle */}
          <div className="flex items-center gap-1 bg-zinc-950/20 border border-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "active-tab-capsule"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="List View (L)"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "active-tab-capsule"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View (G)"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Synced Offline Files */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Ready Offline</h3>
        
        {loading ? (
          <div className="text-sm text-zinc-500 text-center py-10 bg-zinc-900/10 rounded-2xl border border-white/5 border-dashed flex flex-col items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading files...
          </div>
        ) : filteredFiles.length > 0 ? (
          viewMode === "list" ? (
            <div className="flex flex-col gap-2.5">
              <AnimatedList className="!gap-2" delayOffset={0.02} maxDelay={0.25}>
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-[var(--accent)] shrink-0">
                          <FileIcon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate max-w-[200px] sm:max-w-[450px]">{file.name}</div>
                          <span className="text-[9px] text-zinc-500 mt-1 block">{formatSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          <span>Offline Ready</span>
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.viewLink && (
                            <a
                              href={file.viewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-350 hover:text-white transition-colors"
                              title="View"
                            >
                              <Eye size={12} />
                            </a>
                          )}
                          {file.downloadLink && (
                            <a
                              href={file.downloadLink}
                              className="p-1.5 rounded-md bg-[var(--accent-wash)] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                              title="Download"
                            >
                              <Download size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AnimatedList>
            </div>
          ) : (
            /* Grid View with Tilted Card effects */
            <div className="w-full">
              <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 !w-full" delayOffset={0.03}>
                {filteredFiles.map((file) => (
                  <FileGridCard
                    key={file.id}
                    file={file}
                    formatSize={formatSize}
                    getFileIcon={getFileIcon}
                  />
                ))}
              </AnimatedList>
            </div>
          )
        ) : (
          <div className="text-sm text-zinc-550 text-center py-10 bg-zinc-900/10 rounded-2xl border border-white/5 border-dashed">
            No offline files match your search or filter criteria.
          </div>
        )}
      </div>

    </div>
  );
}
