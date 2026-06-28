"use client";

import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export default function UpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Only run in Tauri context
    if (typeof window === "undefined" || !(('__TAURI_INTERNALS__' in window || 'isTauri' in window))) return;

    // Skip update check in development mode to avoid dev server console errors and Next.js dev overlay disruption
    if (process.env.NODE_ENV === "development") {
      console.log("[Updater] Skipping update check in development mode");
      return;
    }

    async function checkForUpdates() {
      try {
        const update = await check();
        if (update?.available) {
          setUpdateInfo(update);
        }
      } catch (err) {
        // Log as a warning instead of error to avoid polluting console, especially if offline
        console.warn("Failed to check for updates:", err);
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
            contentLength = event.data.contentLength;
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
    <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 p-4 rounded-lg shadow-xl text-white z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-2">Update Available</h3>
      <p className="text-sm text-zinc-300 mb-4">
        Version {updateInfo.version} is available. You are on v{updateInfo.currentVersion}.
        <br />
        {updateInfo.body && <span className="block mt-2 text-xs italic">{updateInfo.body}</span>}
      </p>

      {isDownloading ? (
        <div className="w-full bg-zinc-700 rounded-full h-2 mb-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          ></div>
          <p className="text-xs text-right mt-1">{downloadProgress}%</p>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setUpdateInfo(null)}
            className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Update Now
          </button>
        </div>
      )}
    </div>
  );
}
