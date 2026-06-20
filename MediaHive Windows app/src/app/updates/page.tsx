"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, GitCommit, Calendar, Tag, ArrowRight, CheckCircle2, 
  Cpu, Layers, ShieldCheck, ChevronRight
} from "lucide-react";

interface ChangelogItem {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  title: string;
  description: string;
  categories: {
    name: string;
    items: string[];
  }[];
  tags: string[];
}

export default function UpdatesPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "major" | "minor" | "patch">("all");

  const changelogData: ChangelogItem[] = [
    {
      version: "v2.4.0",
      date: "June 03, 2026",
      type: "major",
      title: "The Cyber-Noir Interface Upgrade",
      description: "A complete visual and architectural overhaul of the desktop application workspace. Introduced dual-sidebar navigation, hardware-accelerated transitions, and global responsive layouts.",
      tags: ["UI/UX", "Tauri Core", "Desktop Parity"],
      categories: [
        {
          name: "Interface & Experience",
          items: [
            "Introduced dual-sidebar navigation structure mimicking web flat route parity.",
            "Implemented Cyber-Noir theme configuration using Tailwind CSS v4 variables.",
            "Added rich micro-animations and custom glassmorphism panels to all main dashboards.",
            "Optimized workspace rendering for high-DPI Windows displays."
          ]
        },
        {
          name: "System & Core",
          items: [
            "Integrated Rust/Tauri native system tray menu controls.",
            "Optimized SQLite metadata caching, reducing database read latency by 45%.",
            "Added automatic token rotation support for security credentials."
          ]
        }
      ]
    },
    {
      version: "v2.3.5",
      date: "May 18, 2026",
      type: "minor",
      title: "Real-time Asset Pipeline & Collaboration",
      description: "Enhanced local asset caching system and introduced bidirectional chat state notifications directly in the workspace header.",
      tags: ["Chat", "Asset Pipeline", "Cache"],
      categories: [
        {
          name: "Asset Pipeline",
          items: [
            "Added support for batch uploading large image folders (up to 500MB).",
            "Implemented local blurhash rendering to preview offline assets instantly.",
            "Optimized asset metadata graph representation with Graphify v2.1."
          ]
        },
        {
          name: "Chat & Notifications",
          items: [
            "Enabled persistent local chat database storage via Tauri file backend.",
            "Fixed WebSocket reconnection loop on windows-network-dropout event."
          ]
        }
      ]
    },
    {
      version: "v2.3.0",
      date: "April 29, 2026",
      type: "minor",
      title: "Production Tasks & Kanban Engine",
      description: "Designed a dedicated tasks and planning portal with customized status boards, drag-and-drop triggers, and schedule overlays.",
      tags: ["Kanban", "Tasks", "Tauri Engine"],
      categories: [
        {
          name: "Workflow Engine",
          items: [
            "Built custom Kanban board view with multi-select drag actions.",
            "Created calendar engine integrating with local Microsoft 365 calendars.",
            "Added CSV export capabilities for task completion timelines."
          ]
        }
      ]
    },
    {
      version: "v2.2.1",
      date: "March 12, 2026",
      type: "patch",
      title: "Performance Patches & Security Hardening",
      description: "Addressed memory leaks during heavy media catalog operations and strengthened local encryption.",
      tags: ["Security", "Patch", "Memory Fix"],
      categories: [
        {
          name: "Fixes & Tuning",
          items: [
            "Resolved heap allocation leaks on background image processing threads.",
            "Upgraded local database encryption algorithm to AES-256-GCM.",
            "Updated layout engine compatibility with Next.js App Router rules."
          ]
        }
      ]
    }
  ];

  const filteredItems = activeFilter === "all" 
    ? changelogData 
    : changelogData.filter(item => item.type === activeFilter);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Version Control
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Changelog & Updates</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Track product releases, engine upgrades, and system version history.
          </p>
        </div>

        {/* Current status info */}
        <div className="flex items-center gap-3 bg-zinc-900/40 border border-white/5 p-3 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Client</span>
            <span className="text-xs font-bold text-teal-400">v2.4.0-Stable</span>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Channel</span>
            <span className="text-xs font-bold text-indigo-400">Production</span>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900/10 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 bg-zinc-950/40 p-1 rounded-xl border border-white/5">
          {(["all", "major", "minor", "patch"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === filter 
                  ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="text-xs text-zinc-500">
          Showing <span className="text-teal-400 font-bold">{filteredItems.length}</span> releases
        </div>
      </div>

      {/* Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: System Metrics Summary */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0 flex items-center gap-2">
              <Cpu size={14} className="text-teal-400" />
              Engine Status
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-400">Tauri Runtime</span>
                <span className="text-xs font-mono text-zinc-200">v2.0.4</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-400">SQLite Backend</span>
                <span className="text-xs font-mono text-zinc-200">v3.45.1</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-zinc-400">Graph Engine</span>
                <span className="text-xs font-mono text-zinc-200">v2.1.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Integrity Check</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={12} /> Passed
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0 flex items-center gap-2">
              <Layers size={14} className="text-indigo-400" />
              Distribution Channels
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Updates are distributed via local Tauri push networks. Ensure your engine client is connected to trigger automatic background checks.
            </p>
          </div>
        </div>

        {/* Right Side: Timeline list */}
        <div className="lg:col-span-3 flex flex-col gap-8 relative border-l border-white/5 pl-6 ml-3 lg:ml-0">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.version}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Timeline marker */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-950 border-2 border-teal-500 flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping absolute opacity-75"></div>
                <div className="w-1 h-1 rounded-full bg-teal-400"></div>
              </div>

              {/* Card Container */}
              <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/30 transition-all">
                {/* Badge Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white font-mono bg-zinc-950/60 px-3 py-1 rounded-xl border border-white/5">
                      {item.version}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      item.type === "major" 
                        ? "bg-red-500/10 border-red-500/30 text-red-400" 
                        : item.type === "minor"
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                        : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    }`}>
                      {item.type} update
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar size={12} />
                    <span>{item.date}</span>
                  </div>
                </div>

                {/* Update Title */}
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-teal-400 transition-colors">
                  {item.title}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {item.description}
                </p>

                {/* Sub-categories */}
                <div className="flex flex-col gap-5 border-t border-white/5 pt-5">
                  {item.categories.map((cat, catIdx) => (
                    <div key={catIdx} className="flex flex-col gap-2">
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <ChevronRight size={14} className="text-teal-500" />
                        {cat.name}
                      </h4>
                      <ul className="flex flex-col gap-2 pl-5 m-0">
                        {cat.items.map((bullet, bulletIdx) => (
                          <li key={bulletIdx} className="text-xs text-zinc-400 leading-relaxed list-disc marker:text-zinc-600">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap gap-2 mt-6 border-t border-white/5 pt-4">
                  {item.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-[10px] font-semibold bg-zinc-950/40 border border-white/5 text-zinc-400 px-2.5 py-1 rounded-lg">
                      <Tag size={10} className="text-teal-500/60" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}

