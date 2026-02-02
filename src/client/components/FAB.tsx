"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Plus, CheckSquare, Calendar, Bell, Users, Package } from "lucide-react";
import AppLink from "@/components/AppLink";
import { triggerHaptic } from "@/lib/haptics";


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
    triggerHaptic();
    if (onMainClick) {
      onMainClick();
    } else {
      setIsOpen(!isOpen);
    }
  };


  const allActions = [
    { label: "Task", icon: CheckSquare, href: "/tasks/new", delay: 0.1 },
    { label: "Event", icon: Calendar, href: "/events/new", delay: 0.05 },
    { label: "Notify", icon: Bell, href: "/notifications/new", delay: 0, role: 'admin' },
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
        {isOpen && (
          <div className="fixed inset-0 z-40 overflow-hidden pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60"
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              onClick={() => setIsOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[50] flex flex-col-reverse items-center gap-4 pointer-events-auto"
        style={{ bottom: 'calc(1.5rem + 8px)' }}
      >
        <motion.button
          className="w-16 h-16 rounded-full text-primary-foreground shadow-medium flex items-center justify-center relative z-20 bg-primary hover:bg-primary/90 border border-border/50 overflow-hidden"
          onClick={() => {
            triggerHaptic();
            setIsOpen(!isOpen);
          }}
          aria-label="Open Actions Menu"
          aria-expanded={isOpen}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
        >
          <Plus size={32} strokeWidth={2.5} />
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-20 flex flex-col items-center gap-5 w-max z-[60]">
              {actions.map((action) => (
                <AppLink key={action.label} href={action.href} onClick={() => setIsOpen(false)}>
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: action.delay }} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-soft relative overflow-hidden text-foreground">
                      <action.icon size={20} strokeWidth={2} />
                    </div>
                    {/* Clean Label */}
                    <span className="text-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm bg-card border border-border shadow-soft">{action.label}</span>
                  </motion.div>
                </AppLink>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

