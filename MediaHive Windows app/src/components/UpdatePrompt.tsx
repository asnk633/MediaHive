"use client";

import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ShieldCheck, ArrowUpCircle, RefreshCw } from "lucide-react";

export default function UpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Only run in Tauri context
    const isTauriApp = typeof window !== "undefined" && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).isTauri);
    if (!isTauriApp) return;

    // Skip update check in development mode to avoid dev server console errors
    if (process.env.NODE_ENV === "development") {
      console.log("[Updater] Skipping update check in development mode");
      return;
    }

    async function checkForUpdates() {
      try {
        const update = await check();
        if (update) {
          setUpdateInfo(update);
        }
      } catch (err) {
        console.warn("Failed to check for updates on startup:", err);
      }
    }

    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;
    setIsDownloading(true);

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            break;
        }
      });

      // Relaunch the app after update is installed
      await relaunch();
    } catch (err) {
      console.error("Failed to install update:", err);
      setIsDownloading(false);
      setDownloadProgress(0);
      alert("Failed to install update. Please try again later.");
    }
  };

  if (!updateInfo) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-[#09090b]/90 border border-white/10 p-5 rounded-2xl shadow-2xl shadow-black/80 text-white z-[99999] max-w-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shrink-0">
          <ArrowUpCircle size={20} className="animate-bounce" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm tracking-tight text-white m-0">Software Update Available</h3>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed m-0">
            Version v{updateInfo.version} is ready to download. You are currently on v{updateInfo.currentVersion || "0.1.2"}.
          </p>
          
          {updateInfo.body && (
            <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/5 text-[10px] text-zinc-300 leading-normal max-h-24 overflow-y-auto font-mono whitespace-pre-line">
              {updateInfo.body}
            </div>
          )}

          <div className="mt-4">
            {isDownloading ? (
              <div className="w-full">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1.5 font-semibold">
                  <span>Downloading package...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setUpdateInfo(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-white/10 transition-colors text-zinc-300 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 rounded-lg text-white shadow-lg shadow-amber-500/15 active:scale-95 transition-all cursor-pointer"
                >
                  Update Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
