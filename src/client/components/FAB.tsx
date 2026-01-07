"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, CheckSquare, Calendar, Bell, Users, Package } from "lucide-react";
import Link from "next/link";


interface FABProps {
  onMainClick?: () => void;
}

import { createPortal } from "react-dom";

export default function FAB({ onMainClick }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // If onMainClick is provided, it overrides the menu behavior
  const handleClick = () => {
    if (onMainClick) {
      onMainClick();
    } else {
      setIsOpen(!isOpen);
    }
  };


  const allActions = [
    { label: "Task", icon: CheckSquare, color: "bg-teal-500/20 text-teal-300 border-teal-500/30 hover:border-teal-400 hover:bg-teal-500/30", shadow: "shadow-[0_0_20px_rgba(20,184,166,0.5)]", href: "/tasks/new", delay: 0.1 },
    { label: "Event", icon: Calendar, color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/30", shadow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]", href: "/events/new", delay: 0.05 },
    { label: "Notify", icon: Bell, color: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:border-orange-400 hover:bg-orange-500/30", shadow: "shadow-[0_0_20px_rgba(249,115,22,0.5)]", href: "/notifications/new", delay: 0, role: 'admin' },
  ];

  const actions = allActions.filter(action => !action.role || action.role === user?.role);

  // Check for hide-fab class on body
  const [isHidden, setIsHidden] = useState(false);

  React.useEffect(() => {
    const checkHidden = () => {
      setIsHidden(document.body.classList.contains('hide-fab'));
    };

    // Initial check
    checkHidden();

    // Observer
    const observer = new MutationObserver(checkHidden);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  if (isHidden) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && mounted && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[20]"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            onClick={() => setIsOpen(false)}
          />,
          document.body
        )}
      </AnimatePresence>
      <div className="relative flex flex-col-reverse items-center gap-4">
        <motion.button
          className="w-16 h-16 rounded-full text-white shadow-[0_8px_30px_rgba(79,70,229,0.5)] flex items-center justify-center relative z-20 bg-gradient-to-br from-blue-600 to-violet-600 hover-sheen overflow-hidden border border-white/20"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Actions Menu"
          aria-expanded={isOpen}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
        >
          <Plus size={32} strokeWidth={2.5} />
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-20 flex flex-col items-center gap-5 w-max z-[110]">
              {actions.map((action) => (
                <Link key={action.label} href={action.href} onClick={() => setIsOpen(false)}>
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: action.delay }} className="flex flex-col items-center gap-2 group">
                    <div className={`w-14 h-14 rounded-full backdrop-blur-xl border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 hover-sheen relative overflow-hidden ${action.color} ${action.shadow} shadow-lg ring-1 ring-white/20`}>
                      <action.icon size={24} strokeWidth={2} />
                    </div>
                    {/* Clean Label */}
                    <span className="text-white text-[10px] font-bold px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-xl">{action.label}</span>
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