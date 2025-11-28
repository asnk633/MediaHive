
import React from "react";

export default function TopBar() {
  return (
    <header className="w-full py-3 px-4 shadow-sm bg-gradient-to-r from-indigo-700 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold">Thaiba Garden Media Manager</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">Backend: healthy</span>
          <button className="px-3 py-1 rounded-md bg-white/10">Profile</button>
        </div>
      </div>
    </header>
  );
}
