"use client";
import React, { useState } from "react";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Plus, CheckSquare, Calendar, Bell, Package, CalendarPlus, PackagePlus, Upload } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import AppLink from "@/components/AppLink";
import { triggerHaptic } from "@/lib/haptics";
import { cn, nativeNavigate } from '@/lib/utils';

interface FABProps {
  onMainClick?: () => void;
}

import { createPortal } from "react-dom";

export default function FAB({ onMainClick }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const FAB_CONFIG: Record<string, { icon: any; label: string; href?: string; role?: string }> = {
    "/tasks": { icon: CheckSquare, label: "Create Task", href: "/tasks/new" },
    "/events": { icon: CalendarPlus, label: "Create Event", href: "/events/new" },
    "/downloads": { icon: Upload, label: "Upload File", href: "/downloads/new" },
    "/inventory": { icon: PackagePlus, label: "Add Item", href: "/inventory/new" },
  };

  const getPageConfig = () => {
    const config = FAB_CONFIG[pathname || ""];
    if (config) return config;
    for (const route in FAB_CONFIG) {
      if (pathname?.startsWith(route + "/")) return FAB_CONFIG[route];
    }
    return { icon: Plus, label: "Open Actions Menu" };
  };

  const currentConfig = getPageConfig();
  const ContextIcon = currentConfig.icon;

  const allActions = [
    { label: "Task", icon: CheckSquare, href: "/tasks/new", delay: 0.1 },
    { label: "Event", icon: CalendarPlus, href: "/events/new", delay: 0.05 },
    { label: "Item", icon: PackagePlus, href: "/inventory/new", delay: 0 },
    { label: "Notify", icon: Bell, href: "/notifications/new", delay: 0, role: 'admin' },
  ];

  const actions = allActions.filter(action => !action.role || action.role === user?.role);

  const handleClick = () => {
    triggerHaptic();

    if (isOpen) {
      setIsOpen(false);
    } else if (onMainClick) {
      onMainClick();
    } else {
      const isMember = user?.role === 'member';
      const hasRoleAccess = !currentConfig.role || currentConfig.role === user?.role;

      if (currentConfig.href && hasRoleAccess && !isMember) {
        nativeNavigate(currentConfig.href, router, 'FAB.tsx');
      } else {
        setIsOpen(true);
      }
    }
  };

  const getGlowColor = () => {
    if (pathname?.startsWith('/tasks')) return 'rgba(167, 139, 250, 0.4)';
    if (pathname?.startsWith('/events')) return 'rgba(96, 165, 250, 0.4)';
    if (pathname?.startsWith('/inventory')) return 'rgba(45, 212, 191, 0.4)';
    return 'rgba(129, 140, 248, 0.4)';
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 overflow-hidden pointer-events-auto lg:hidden">
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
        className="fab fab-root fixed left-1/2 z-[110] flex flex-col-reverse items-center gap-4 pointer-events-auto lg:hidden"
        style={{ 
          bottom: 'calc(var(--bottom-nav-height, 4.5rem) + var(--safe-bottom, 1.5rem))',
          transform: 'translate(-50%, 50%) translateY(calc(-1 * var(--keyboard-offset, 0px))) translateY(var(--fab-optical-offset, 2px))',
          '--fab-glow-color': getGlowColor()
        } as any}
      >
        <MagneticFABButton
          isOpen={isOpen}
          handleClick={handleClick}
          pathname={pathname}
          currentConfig={currentConfig}
          ContextIcon={ContextIcon}
        />
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-20 flex flex-col items-center gap-5 w-max z-[60]">
              {actions.map((action) => (
                <AppLink key={action.label} href={action.href} onClick={() => setIsOpen(false)}>
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: action.delay }} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-full premium-card flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_20px_rgba(99,102,241,0.3)] relative overflow-hidden text-foreground">
                      <action.icon size={20} strokeWidth={2} />
                    </div>
                    <span className="text-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg premium-card">{action.label}</span>
                  </motion.div>
                </AppLink>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>,
    document.body
  );
}

function MagneticFABButton({
  isOpen, handleClick, pathname, currentConfig, ContextIcon
}: {
  isOpen: boolean; handleClick: () => void; pathname: string | null;
  currentConfig: { label: string; href?: string; role?: string };
  ContextIcon: any;
}) {
  const { ref: magneticRef, style: magneticStyle } = useMagneticHover(30, 0.35);

  return (
    <div ref={magneticRef as React.RefObject<HTMLDivElement>} style={magneticStyle}>
      <motion.button
        id="fab-main-action"
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center relative z-20 fab-surface border border-foreground/10 backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "animate-fab-breathing"
        )}
        style={{ boxShadow: '0 6px 24px var(--fab-glow-color)' }}
        onClick={handleClick}
        aria-label={isOpen ? "Close Menu" : currentConfig.label}
        aria-expanded={isOpen}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 135 : 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : `${pathname}-${currentConfig.label}`}
            initial={{ opacity: 0, scale: 0.9, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {isOpen ? (
              <Plus size={32} strokeWidth={2.8} className="text-foreground" />
            ) : (
              <ContextIcon size={32} strokeWidth={2.8} className="text-foreground opacity-95" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
