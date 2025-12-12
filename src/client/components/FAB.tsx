"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/app/(shell)/RoleContext";
import { Plus, CheckSquare, Calendar, Bell, Users } from "lucide-react";
import Link from "next/link";

export default function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useRole();

  const allActions = [
    { label: "Task", icon: CheckSquare, color: "bg-[#00A896]", href: "/tasks/new", delay: 0.1 },
    { label: "Event", icon: Calendar, color: "bg-[#6A5ACD]", href: "/events/new", delay: 0.05 },
    { label: "Notify", icon: Bell, color: "bg-[#FF5630]", href: "/notifications/new", delay: 0, role: 'admin' },
  ];

  const actions = allActions.filter(action => !action.role || action.role === user?.role);

  return (
    <>
      <AnimatePresence>
        {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={() => setIsOpen(false)} />}
      </AnimatePresence>
      <div className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-4" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}>
        <motion.button
          className="w-16 h-16 rounded-full text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center relative z-20"
          style={{ backgroundColor: 'var(--color-fab-bg, #6366F1)' }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Actions Menu"
          aria-expanded={isOpen}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
        >
          <Plus size={32} />
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-20 flex flex-col items-center gap-4 w-max">
              {actions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: action.delay }} className="flex flex-col items-center gap-1">
                    <div className={`${action.color} w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}>
                      <action.icon size={20} strokeWidth={2.5} />
                    </div>
                    {/* Clean Label below circle, referencing "baby buttons" style */}
                    <span className="text-white text-[10px] font-bold shadow-sm">{action.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}