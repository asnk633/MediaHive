"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FlaskConical, Sparkles, AlertTriangle, 
  ToggleLeft, ToggleRight, CheckCircle2
} from "lucide-react";

export default function LabsPage() {
  const [features, setFeatures] = useState([
    { id: 1, title: "AI Metadata Extraction", desc: "Automatically index and tag media assets on upload using computer vision models.", active: true },
    { id: 2, title: "Offline Sync Engine", desc: "Keep local desktop files synchronized with the cloud backend on a background thread.", active: true },
    { id: 3, title: "Collaborative Canvas boards", desc: "Live boards to brainstorm visual directions with team members.", active: false },
    { id: 4, title: "Auto Subtitling & Transcription", desc: "Convert video audio tracks to text scripts and subtitles instantly.", active: false }
  ]);

  const toggleFeature = (id: number) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
          <Sparkles size={14} className="animate-pulse" />
          R&D Portal
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">MediaHive Labs</h1>
        <p className="text-zinc-400 m-0 text-sm mt-1">
          Enable or disable experimental features. Use caution as these are under active development.
        </p>
      </header>

      {/* Warning Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
        <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider m-0">Warning</h4>
          <p className="text-xs text-zinc-400 mt-1 m-0 leading-relaxed">
            Experimental items may impact database indexing sync speeds. Backup files before toggling cache modules.
          </p>
        </div>
      </div>

      {/* Toggle List Grid */}
      <div className="flex flex-col gap-4 mt-2">
        {features.map((feat) => (
          <div 
            key={feat.id}
            className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/20 border border-white/5 hover:border-white/10 hover:bg-zinc-900/30 transition-all gap-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-200 m-0">{feat.title}</h3>
                {feat.active && (
                  <span className="text-[8px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Running
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 m-0 leading-relaxed max-w-xl">{feat.desc}</p>
            </div>

            <button
              onClick={() => toggleFeature(feat.id)}
              className={`w-10 h-6 rounded-full p-0.5 transition-all duration-200 cursor-pointer flex-shrink-0 ${feat.active ? "bg-teal-500" : "bg-zinc-800"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${feat.active ? "translate-x-4" : "translate-x-0"}`}></div>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
