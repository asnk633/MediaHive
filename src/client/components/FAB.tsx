"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, CheckSquare, Calendar, Bell, Users, Package } from "lucide-react";
import Link from "next/link";


interface FABProps {
  onMainClick?: () => void;
}

export default function FAB({ onMainClick }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // If onMainClick is provided, it overrides the menu behavior
  const handleClick = () => {
    if (onMainClick) {
      onMainClick();
    } else {
      setIsOpen(!isOpen);
    }
  };


  const allActions = [
    { label: "Task", icon: CheckSquare, color: "bg-teal-500/20 text-teal-300 border-teal-500/30", href: "/tasks/new", delay: 0.1 },
    { label: "Event", icon: Calendar, color: "bg-purple-500/20 text-purple-300 border-purple-500/30", href: "/events/new", delay: 0.05 },
    { label: "Notify", icon: Bell, color: "bg-orange-500/20 text-orange-300 border-orange-500/30", href: "/notifications/new", delay: 0, role: 'admin' },
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
        {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />}
      </AnimatePresence>
      <div className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-4" style={{ bottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
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
            <div className="absolute bottom-24 flex flex-col items-center gap-5 w-max">
              {actions.map((action) => (
                <Link key={action.label} href={action.href} onClick={() => setIsOpen(false)}>
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: action.delay }} className="flex flex-col items-center gap-2 group">
                    <div className={`w-14 h-14 rounded-full backdrop-blur-xl border shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 hover-sheen relative overflow-hidden ${action.color}`}>
                      <action.icon size={24} strokeWidth={2} />
                    </div>
                    {/* Clean Label */}
                    <span className="text-white text-[10px] font-bold px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-md">{action.label}</span>
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