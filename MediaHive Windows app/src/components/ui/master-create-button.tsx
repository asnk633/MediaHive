"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckSquare, Calendar, FileText, Package, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { CreateTaskModal } from "../modals/CreateTaskModal";
import { CreateEventModal } from "../modals/CreateEventModal";
import { FileUploadModal } from "../modals/FileUploadModal";
import { CreateInventoryModal } from "../modals/CreateInventoryModal";
import { CreateNotificationModal } from "../modals/CreateNotificationModal";

export function MasterCreateButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal open states
  const [showTask, setShowTask] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [showFile, setShowFile] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const role = user?.role || "member";

  // Filter items based on user role permissions
  const menuItems = [
    {
      icon: CheckSquare,
      label: "Task",
      desc: "Create a new workspace task",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      allowed: true, // All roles can create tasks
      action: () => setShowTask(true),
    },
    {
      icon: Calendar,
      label: "Event",
      desc: "Schedule a team meeting",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
      allowed: role === "admin" || role === "manager" || role === "team",
      action: () => setShowEvent(true),
    },
    {
      icon: FileText,
      label: "File",
      desc: "Upload a new document",
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      border: "border-teal-400/20",
      allowed: role === "admin" || role === "manager" || role === "team",
      action: () => setShowFile(true),
    },
    {
      icon: Package,
      label: "Inventory",
      desc: "Add new lab equipment",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20",
      allowed: role === "admin" || role === "manager" || role === "team",
      action: () => setShowInventory(true),
    },
    {
      icon: Bell,
      label: "Notification",
      desc: "Send an alert broadcast",
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      border: "border-pink-400/20",
      allowed: role === "admin" || role === "manager",
      action: () => setShowNotification(true),
    },
  ].filter(item => item.allowed);

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
          className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 border ${
            isOpen 
              ? "bg-[var(--bg-tertiary)] border-[var(--border)]" 
              : "bg-[var(--bg-sidebar)] border-[var(--border)] hover:bg-[var(--bg-tertiary)]"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="flex items-center justify-center w-5 h-5 rounded transition-colors bg-[var(--accent)]/15 text-[var(--accent)] group-hover:bg-[var(--accent)]/20"
          >
            <Plus size={12} strokeWidth={2.5} />
          </div>
          
          <span className="relative z-10 text-[12px] font-semibold tracking-wide text-[var(--text-primary)]">
            Create
          </span>
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors"
          >
            <ChevronDown size={12} strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        {/* The Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-64 bg-[var(--bg-tertiary)] border border-[var(--border)] shadow-xl overflow-hidden rounded-md z-50"
            >
              {/* Header */}
              <div className="px-4 py-2 border-b border-[var(--border)] bg-black/20">
                <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Quick Create</h3>
              </div>

              {/* Items List */}
              <div className="flex flex-col p-1.5">
                {menuItems.map((item, index) => (
                  <div
                    key={item.label}
                    onClick={() => {
                      setIsOpen(false);
                      item.action();
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group flex items-center gap-3 p-2 rounded hover:bg-[var(--bg-sidebar)] transition-all cursor-pointer relative overflow-hidden"
                    >
                      {/* Active hover edge highlight */}
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--accent)]" />
                      
                      <div 
                        className={`flex items-center justify-center w-8 h-8 rounded bg-[var(--bg-sidebar)] ${item.color} border border-[var(--border)] shadow-inner transition-transform`}
                      >
                        <item.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[var(--text-primary)] transition-colors tracking-wide leading-none mb-1">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] transition-colors leading-none">
                          {item.desc}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2 border-t border-[var(--border)] bg-black/20">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[var(--text-tertiary)] font-medium">Keyboard shortcut</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] border border-[var(--border)] text-[8px] font-mono text-[var(--text-tertiary)] font-bold">Ctrl</kbd>
                    <span className="text-[var(--text-tertiary)] text-[9px]">+</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] border border-[var(--border)] text-[8px] font-mono text-[var(--text-tertiary)] font-bold">K</kbd>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inline Quick-Create Modals */}
      <CreateTaskModal isOpen={showTask} onClose={() => setShowTask(false)} />
      <CreateEventModal isOpen={showEvent} onClose={() => setShowEvent(false)} />
      <FileUploadModal isOpen={showFile} onClose={() => setShowFile(false)} />
      <CreateInventoryModal isOpen={showInventory} onClose={() => setShowInventory(false)} />
      <CreateNotificationModal isOpen={showNotification} onClose={() => setShowNotification(false)} />
    </>
  );
}
