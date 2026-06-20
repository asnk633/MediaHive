"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderPlus, Upload, Search, Filter, Folder,
  Grid, List, MoreVertical, Sparkles, X, 
  CheckCircle2, AlertCircle, Loader2, Eye, Download, Trash2,
  FileText, Film, Music, FileArchive, File as FileIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import TiltedCard from "@/components/TiltedCard";
import { AnimatedList } from "@/components/ui/animated-list";

type ToastType = "success" | "error" | "loading";

interface Toast {
  type: ToastType;
  message: string;
}

export default function MediaPage() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
      const matchesFolder = !selectedFolder || (file.folder === selectedFolder);
      return matchesSearch && matchesFolder;
    });
  }, [files, search, selectedFolder]);

  const folders = useMemo(() => [
    { name: "Flowers", count: `${files.filter(f => (f.name || "").toLowerCase().includes("flower")).length} items` },
    { name: "Nature", count: `${files.filter(f => (f.name || "").toLowerCase().includes("nature")).length} items` },
    { name: "Backgrounds", count: `${files.filter(f => (f.name || "").toLowerCase().includes("bg") || (f.name || "").toLowerCase().includes("background")).length} items` },
    { name: "Inspiration", count: `${files.filter(f => (f.name || "").toLowerCase().includes("inspire") || (f.name || "").toLowerCase().includes("inspiration")).length} items` },
    { name: "Portraits", count: `${files.filter(f => (f.name || "").toLowerCase().includes("portrait") || (f.name || "").toLowerCase().includes("face")).length} items` },
    { name: "Outfits", count: `${files.filter(f => (f.name || "").toLowerCase().includes("outfit") || (f.name || "").toLowerCase().includes("wear")).length} items` },
  ], [files]);

  const tags = ["#Adventure", "#Aesthetic", "#Animal", "#Baby", "#Brown", "#Creative", "#Design", "#Studio"];

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    if (type !== "loading") {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const fetchFiles = async () => {
    if (!user?.institution_id && !user?.tenant_id) return;
    try {
      let query = supabase.from('files').select('*').not('name', 'ilike', 'INV_%');
      if (user.institution_id) {
        query = query.eq('institution_id', user.institution_id);
      } else if (user.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      }
      
      const { data } = await query.order('created_at', { ascending: false });

      // Get signed URLs for images
      const enriched = await Promise.all((data || []).map(async (file) => {
        let display_url = file.drive_file_id 
          ? `https://drive.google.com/thumbnail?id=${file.drive_file_id}&sz=w800` 
          : (file.thumbnail_link || file.download_link || file.web_view_link || file.file_url);
        let original_url = file.download_link || file.web_view_link || file.file_url;
        
        // Determine storage path
        let storagePath = file.storage_path || file.storagePath;
        if (!storagePath && file.file_url) {
          if (!file.file_url.startsWith('http') && !file.file_url.startsWith('data:')) {
            storagePath = file.file_url;
          } else if (file.file_url.includes('/storage/v1/object/public/')) {
            const urlParts = file.file_url.split('/public/');
            if (urlParts.length > 1) {
              storagePath = urlParts[1].split('/').slice(1).join('/');
            }
          }
        }
        
        if (storagePath && storagePath !== 'null') {
           const { data: signedData } = await supabase.storage.from('files').createSignedUrl(storagePath, 3600);
           if (signedData?.signedUrl) {
             display_url = signedData.signedUrl;
           } else {
             // Fallback to media-library bucket just in case
             const { data: signedData2 } = await supabase.storage.from('media-library').createSignedUrl(storagePath, 3600);
             if (signedData2?.signedUrl) {
               display_url = signedData2.signedUrl;
               original_url = signedData2.signedUrl;
             }
           }
        }
        
        return { 
          ...file, 
          display_url, 
          original_url,
          file_size: file.file_size || file.size, 
          file_type: file.file_type || file.mime_type 
        };
      }));

      setFiles(enriched || []);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length || !user) return;

    setUploading(true);
    showToast("loading", `Uploading ${selected.length} file(s)...`);

    let successCount = 0;
    let failCount = 0;

    for (const file of selected) {
      try {
        const ext = file.name.split('.').pop();
        const path = `${user.institution_id}/${Date.now()}_${file.name}`;

        // 1. Upload to Supabase Storage - using 'files' bucket to match web app
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('files')
          .upload(path, file, { upsert: false });

        if (storageError) throw storageError;

        // 3. Register in the files table
        const { error: dbError } = await supabase.from('files').insert({
          name: file.name,
          file_url: storageData.path,
          file_type: file.type,
          file_size: file.size,
          folder: null,
          visibility: 'all',
          uploaded_by_id: user.id,
          institution_id: user.institution_id,
          tenant_id: user.tenant_id,
          storage_path: storageData.path, // Save storage path as well
          created_at: new Date().toISOString(),
        });

        if (dbError) throw dbError;
        successCount++;
      } catch (err: any) {
        console.error("Upload failed for", file.name, err);
        failCount++;
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (successCount > 0) {
      showToast("success", `${successCount} file(s) uploaded successfully!`);
      await fetchFiles(); // Refresh the list
    }
    if (failCount > 0) {
      showToast("error", `${failCount} file(s) failed to upload.`);
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;

    try {
      showToast("loading", "Deleting file...");
      // Extract storage path
      let storagePath = file.storage_path || file.storagePath;
      if (!storagePath && file.file_url && !file.file_url.startsWith('http')) {
        storagePath = file.file_url;
      }
      
      if (!storagePath && file.file_url?.includes('/storage/v1/object/public/')) {
        const urlParts = file.file_url.split('/public/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/');
          const bucket = pathParts[0];
          storagePath = pathParts.slice(1).join('/');
          await supabase.storage.from(bucket).remove([storagePath]);
        }
      } else if (storagePath) {
        // Try files bucket first
        const { error } = await supabase.storage.from('files').remove([storagePath]);
        if (error) {
           await supabase.storage.from('media-library').remove([storagePath]);
        }
      }
      
      await supabase.from('files').delete().eq('id', file.id);
      setFiles(prev => prev.filter(f => f.id !== file.id));
      showToast("success", "File deleted.");
    } catch (err) {
      showToast("error", "Failed to delete file.");
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (file: any) =>
    file.file_type?.startsWith("image/") || 
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(file.name || "") ||
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(file.display_url || "") ||
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(file.download_link || "") ||
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(file.file_url || "");

  const getFileIcon = (file: any, size: number = 32) => {
    const type = (file.file_type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    
    if (type.includes("video") || name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".avi")) {
      return <Film size={size} className="text-indigo-400/70 group-hover:text-indigo-400 transition-colors" />;
    }
    if (type.includes("audio") || name.endsWith(".mp3") || name.endsWith(".wav")) {
      return <Music size={size} className="text-pink-400/70 group-hover:text-pink-400 transition-colors" />;
    }
    if (type.includes("pdf") || name.endsWith(".pdf")) {
      return <FileText size={size} className="text-rose-400/70 group-hover:text-rose-400 transition-colors" />;
    }
    if (type.includes("zip") || type.includes("tar") || type.includes("rar")) {
      return <FileArchive size={size} className="text-amber-400/70 group-hover:text-amber-400 transition-colors" />;
    }
    if (name.endsWith(".doc") || name.endsWith(".docx") || name.endsWith(".txt")) {
      return <FileText size={size} className="text-blue-400/70 group-hover:text-blue-400 transition-colors" />;
    }
    return <FileIcon size={size} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />;
  };

  const getValidThumbnailUrls = (file: any): string[] => {
    const urls: string[] = [];
    
    if (file.drive_file_id) {
      // 1. Try Vercel proxy first (good for private files that have thumbnails generated)
      urls.push(`https://thaiba-garden-media-manager.vercel.app/api/drive/image/${file.drive_file_id}?thumbnail=true`);
      // 2. Try direct Drive thumbnail (good for public-with-link files or browser authenticated)
      urls.push(`https://drive.google.com/thumbnail?id=${file.drive_file_id}&sz=w800`);
    }
    
    if (file.thumbnail_link) {
      urls.push(file.thumbnail_link);
    }
    if (file.display_url && !urls.includes(file.display_url)) {
      urls.push(file.display_url);
    }
    if (file.download_link && !urls.includes(file.download_link)) {
      urls.push(file.download_link);
    }
    
    return urls;
  };

  const SmartListImage = ({ srcArray, file }: { srcArray: string[], file: any }) => {
    const [srcIndex, setSrcIndex] = useState(0);
    const [failed, setFailed] = useState(false);
    
    const currentSrc = srcArray[srcIndex];
    
    useEffect(() => {
      setSrcIndex(0);
      setFailed(false);
    }, [srcArray]);
    
    if (srcArray.length > 0 && !failed && currentSrc) {
      return (
        <img
          src={currentSrc}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={() => {
            if (srcIndex < srcArray.length - 1) {
              setSrcIndex(prev => prev + 1);
            } else {
              setFailed(true);
            }
          }}
        />
      );
    }
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
        {getFileIcon(file, 18)}
      </div>
    );
  };

  const filteredAssets = useMemo(() => {
    return files.filter(file => {
      const nameMatch = (file.name || "").toLowerCase().includes(search.toLowerCase());
      const typeMatch = (file.file_type || "").toLowerCase().includes(search.toLowerCase());
      
      let folderMatch = true;
      if (selectedFolder) {
        if (selectedFolder === "Flowers") folderMatch = (file.name || "").toLowerCase().includes("flower") || (file.folder === "Flowers");
        else if (selectedFolder === "Nature") folderMatch = (file.name || "").toLowerCase().includes("nature") || (file.folder === "Nature");
        else if (selectedFolder === "Backgrounds") folderMatch = (file.name || "").toLowerCase().includes("bg") || (file.name || "").toLowerCase().includes("background") || (file.folder === "Backgrounds");
        else if (selectedFolder === "Inspiration") folderMatch = (file.name || "").toLowerCase().includes("inspire") || (file.name || "").toLowerCase().includes("inspiration") || (file.folder === "Inspiration");
        else if (selectedFolder === "Portraits") folderMatch = (file.name || "").toLowerCase().includes("portrait") || (file.name || "").toLowerCase().includes("face") || (file.folder === "Portraits");
        else if (selectedFolder === "Outfits") folderMatch = (file.name || "").toLowerCase().includes("outfit") || (file.name || "").toLowerCase().includes("wear") || (file.folder === "Outfits");
        else folderMatch = file.folder === selectedFolder;
      }

      let tagMatch = true;
      if (selectedTag) {
        const cleanTag = selectedTag.replace("#", "").toLowerCase();
        tagMatch = (file.name || "").toLowerCase().includes(cleanTag) || (file.tags && file.tags.includes(selectedTag));
      }

      return (nameMatch || typeMatch) && folderMatch && tagMatch;
    });
  }, [files, search, selectedFolder, selectedTag]);

  const lastAdded = useMemo(() => {
    return files.slice(0, 4);
  }, [files]);

  const allAssets = filteredAssets;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-semibold ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
              "bg-zinc-900/80 border-white/10 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "loading" && <Loader2 size={16} className="animate-spin" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-4xl w-full glass-panel rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 relative z-10">
                <div>
                  <div className="text-sm font-bold text-white">{previewFile.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{formatSize(previewFile.file_size)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={previewFile.original_url || previewFile.display_url} download={previewFile.name} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                    <Download size={15} />
                  </a>
                  <button onClick={() => setPreviewFile(null)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center bg-zinc-950 min-h-[400px] max-h-[70vh] overflow-hidden">
                {isImage(previewFile) ? (
                  <img src={previewFile.display_url} alt={previewFile.name} className="max-h-[70vh] max-w-full object-contain" />
                ) : (
                  <div className="text-zinc-500 text-sm text-center p-10">Preview not available for this file type.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Asset Manager
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Library</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Organize, preview, and deploy creative assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 text-sm font-medium px-4 py-2 rounded-xl transition-all cursor-pointer">
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>{uploading ? "Uploading..." : "Upload"}</span>
          </button>
        </div>
      </header>

      {/* 2. Search & Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-3 rounded-2xl relative overflow-hidden z-10">
        <div className="relative flex-1 max-w-md w-full relative z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files, tags, folders..."
            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-xs text-zinc-300 transition-colors cursor-pointer">
            <Filter size={14} />
            <span>Filters</span>
          </button>
          <div className="h-5 w-px bg-white/5 mx-1"></div>
          <div className="bg-zinc-950/40 border border-white/5 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white/10 text-teal-400" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white/10 text-teal-400" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
          <Loader2 size={16} className="animate-spin" /> Loading media library...
        </div>
      ) : (
        <>
          {/* 3. Last Added Row */}
          {lastAdded.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">Last Added</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {lastAdded.map((file) => (
                  <motion.div
                    key={file.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col gap-2 cursor-pointer group"
                    onClick={() => setPreviewFile(file)}
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-teal-500/30 group-hover:shadow-lg group-hover:shadow-teal-500/5 transition-all relative">
                      <TiltedCard
                        imageSrc={getValidThumbnailUrls(file)}
                        altText={file.name}
                        customContent={
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600 bg-zinc-900/50 p-2 text-center">
                            {getFileIcon(file, 40)}
                            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 truncate w-full px-2">{file.file_type?.split('/')[1] || "FILE"}</span>
                          </div>
                        }
                        captionText={file.name}
                        showTooltip={false}
                        scaleOnHover={1.05}
                        rotateAmplitude={12}
                        displayOverlayContent={true}
                        overlayContent={
                          <>
                            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 backdrop-blur-md shadow-sm border border-white/20 z-10 pointer-events-none">
                              {getFileIcon(file, 16)}
                            </div>
                            <div className="w-full h-full bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 rounded-2xl">
                              <span className="text-[10px] font-semibold text-white tracking-wider bg-teal-500 px-2 py-0.5 rounded uppercase pointer-events-none">Preview</span>
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(file); }}
                                className="p-1 rounded-lg bg-black/50 text-red-400 hover:bg-red-500/20 transition-colors pointer-events-auto"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        }
                      />
                    </div>
                    <div className="text-xs font-semibold text-zinc-300 truncate px-1">
                      {file.name}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Split Grid: Sidebar & Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* Sidebar Panel */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-6">
              <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-[40px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Folders</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
                    {folders.map((folder, idx) => {
                      const isSelected = selectedFolder === folder.name;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedFolder(isSelected ? null : folder.name)}
                          className={`flex items-center gap-3 p-2 rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-semibold"
                              : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50 hover:border-white/10 text-zinc-200"
                          }`}
                        >
                          <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-teal-400 animate-pulse" : "text-teal-500"}`} />
                          <div className="min-w-0">
                            <div className="text-xs truncate">{folder.name}</div>
                            <div className="text-[9px] text-zinc-500">{folder.count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <span
                        key={idx}
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`text-[10px] font-semibold border px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-semibold"
                            : "bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 border-white/5"
                        }`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            </div>

            {/* Content Panel */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">
                  Assets Grid
                </h3>
                <span className="text-[10px] text-zinc-500 font-semibold">{files.length} files</span>
              </div>

              {files.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-teal-500/30 rounded-2xl p-16 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-400 transition-all cursor-pointer"
                >
                  <Upload size={32} className="text-zinc-700" />
                  <div className="text-sm font-semibold">No files yet — click to upload</div>
                  <div className="text-xs">Images, videos, PDFs and documents supported</div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${viewMode}-${selectedFolder}-${selectedTag}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="w-full"
                  >
                    <AnimatedList className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full" : "flex flex-col gap-2 w-full"}>
                      {allAssets.map((asset) => (
                        viewMode === "grid" ? (
                          <div
                            key={asset.id}
                            className="flex flex-col gap-2 cursor-pointer group w-full"
                            onClick={() => setPreviewFile(asset)}
                          >
                            <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 transition-all relative">
                              <TiltedCard
                                imageSrc={getValidThumbnailUrls(asset)}
                                altText={asset.name}
                                customContent={
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2 text-center bg-zinc-900/50">
                                    {getFileIcon(asset, 32)}
                                    <span className="text-[10px] font-medium text-zinc-500 truncate w-full px-2">{asset.file_type?.split('/')[1] || "FILE"}</span>
                                  </div>
                                }
                                captionText={asset.name}
                                showTooltip={false}
                                scaleOnHover={1.05}
                                rotateAmplitude={12}
                                displayOverlayContent={true}
                                overlayContent={
                                  <>
                                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 backdrop-blur-md shadow-sm border border-white/20 z-10 pointer-events-none">
                                      {getFileIcon(asset, 16)}
                                    </div>
                                    <div className="w-full h-full bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 rounded-2xl">
                                      <span className="text-[10px] font-semibold text-white tracking-wider bg-teal-500 px-2 py-0.5 rounded uppercase pointer-events-none">Preview</span>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleDelete(asset); }}
                                        className="p-1 rounded-lg bg-black/50 text-red-400 hover:bg-red-500/20 transition-colors pointer-events-auto"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </>
                                }
                              />
                            </div>
                            <div className="text-xs font-semibold text-zinc-300 truncate px-1">
                              {asset.name}
                            </div>
                          </div>
                        ) : (
                          <div key={asset.id} className="flex items-center gap-4 p-3 rounded-xl glass-card hover:border-white/10 transition-all group w-full">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0">
                              <SmartListImage srcArray={getValidThumbnailUrls(asset)} file={asset} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-zinc-200 truncate">{asset.name}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{formatSize(asset.file_size)} · {new Date(asset.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setPreviewFile(asset)} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                <Eye size={13} />
                              </button>
                              <a href={asset.original_url || asset.display_url} download={asset.name} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                                <Download size={13} />
                              </a>
                              <button onClick={() => handleDelete(asset)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      ))}
                    </AnimatedList>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
