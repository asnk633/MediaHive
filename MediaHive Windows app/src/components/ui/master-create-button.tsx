"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, Calendar, FileText, Package, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";

export function MasterCreateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { icon: CheckSquare, label: "Task", desc: "Create a new workspace task", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", href: "/tasks/new" },
    { icon: Calendar, label: "Event", desc: "Schedule a team meeting", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", href: "/events/new" },
    { icon: FileText, label: "File", desc: "Upload a new document", color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20", href: "/files/new" },
    { icon: Package, label: "Inventory", desc: "Add new lab equipment", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", href: "/inventory/new" },
    { icon: Bell, label: "Notification", desc: "Send an alert broadcast", color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20", href: "/notifications/new" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative z-50" ref={menuRef}>
        {/* The Trigger Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all duration-300 border ${
            isOpen 
              ? "bg-white/10 border-white/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]" 
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
          }`}
          whileTap={{ scale: 0.97 }}
        >
          {/* Subtle glow behind text when hover */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <motion.div
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center w-6 h-6 rounded-md transition-colors bg-white/10 text-teal-400 group-hover:bg-teal-400/20 group-hover:text-teal-300"
          >
            <Plus size={14} strokeWidth={2.5} />
          </motion.div>
          
          <span className="relative z-10 text-[13px] font-semibold tracking-wide text-zinc-100 transition-colors group-hover:text-white">
            Create
          </span>
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1 text-zinc-500 group-hover:text-zinc-400 transition-colors"
          >
            <ChevronDown size={14} strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        {/* The Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8, scale: 0.96, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-full right-0 mt-3 w-64 bg-[#0a0a0f] border border-white/10 shadow-[0_20px_80px_-10px_rgba(0,0,0,0.8),_0_0_30px_rgba(20,184,166,0.1)] overflow-hidden rounded-[20px]"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Quick Create</h3>
              </div>

              {/* Items List */}
              <div className="flex flex-col p-2">
                {menuItems.map((item, index) => (
                  <Link href={item.href} key={item.label} onClick={() => setIsOpen(false)}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="group flex items-center gap-3 p-2 rounded-[12px] hover:bg-white/[0.06] transition-all cursor-pointer relative overflow-hidden"
                    >
                      {/* Active hover edge highlight */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity ${item.bg.replace('/10', '/80')}`} />
                      
                      <motion.div 
                        className={`flex items-center justify-center w-9 h-9 rounded-xl bg-[#080810]/50 ${item.color} border border-white/[0.05] shadow-inner transition-transform`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="w-4 h-4" strokeWidth={2.5} />
                      </motion.div>
                      
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors tracking-wide leading-none mb-1">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors leading-none">
                          {item.desc}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] bg-black/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-medium">Keyboard shortcut</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/10 border border-white/10 text-[9px] font-mono text-zinc-400 font-bold">Ctrl</kbd>
                    <span className="text-zinc-600 text-[9px]">+</span>
                    <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/10 border border-white/10 text-[9px] font-mono text-zinc-400 font-bold">K</kbd>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
