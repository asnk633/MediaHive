"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Plus, CheckSquare, Calendar, Bell, Users, Package, Download, BarChart3, ShieldCheck, User, X, CalendarPlus, PackagePlus, Upload } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import AppLink from "@/components/AppLink";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";


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

  // Reset menu on route change
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Context-aware configuration
  const FAB_CONFIG: Record<string, { icon: any; label: string; href?: string; role?: string }> = {
    "/tasks": { icon: CheckSquare, label: "Create Task", href: "/tasks/new" },
    "/events": { icon: CalendarPlus, label: "Create Event", href: "/events/new" },
    "/files": { icon: Upload, label: "Upload File", href: "/downloads/new" },
    "/downloads": { icon: Upload, label: "Upload File", href: "/downloads/new" },
    "/inventory": { icon: PackagePlus, label: "Add Item", href: "/inventory/new" },
  };

  const getPageConfig = () => {
    const config = FAB_CONFIG[pathname || ""];
    if (config) return config;

    // Sub-path matching
    for (const route in FAB_CONFIG) {
      if (pathname?.startsWith(route + "/")) return FAB_CONFIG[route];
    }

    // Default Fallback
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

  // --- Phase 33.6: Hardening & Optimization ---
  type FABVisualState = 'interacting' | 'menu_open' | 'guidance' | 'context_flash' | 'idle';
  const timers = React.useRef<Record<string, NodeJS.Timeout>>({});
  const lastRouteRef = React.useRef(pathname);
  const isLocked = React.useRef(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  // --- Phase 33.8: Final Stability & Polish ---
  const bc = React.useRef<BroadcastChannel | null>(null);
  const interactionCount = React.useRef(0);
  const lastSent = React.useRef(0);
  const lastEvent = React.useRef(0);
  const [isLowPower, setIsLowPower] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 1. Stabilized BroadcastChannel (Safety + Throttling)
  React.useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    
    try {
      bc.current = new BroadcastChannel('mh_fab_state');
      const handler = (e: MessageEvent) => {
        if (e.data === 'menu_opened' && isOpen) setIsOpen(false);
      };
      bc.current.addEventListener('message', handler);
      
      if (typeof navigator !== 'undefined' && (navigator as any).connection?.saveData) {
        setIsLowPower(true);
      }
      
      return () => {
        bc.current?.removeEventListener('message', handler);
        bc.current?.close();
      };
    } catch (e) {
      console.warn('FAB Broadcast error', e);
    }
  }, [isOpen]);

  const broadcastThrottled = (msg: string) => {
    const now = Date.now();
    if (now - lastSent.current < 200) return;
    lastSent.current = now;
    bc.current?.postMessage(msg);
  };

  // 2. Adaptive Timing Cap (Predictable Calm: max 3s)
  const getCalmDuration = () => Math.min(1500 + (interactionCount.current * 200), 3000);

  // 3. Telemetry Guard (Throttled logging)
  const trackSafe = (action: string, metadata: any = {}) => {
    const now = Date.now();
    if (now - lastEvent.current < 300) return;
    lastEvent.current = now;
    console.log(`[FAB_ANALYTICS] ${action}`, { route: pathname, state: visualState, ...metadata });
  };

  const setSafeTimeout = (key: string, fn: () => void, delay: number) => {
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, delay);
  };

  React.useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);

  // 4. Visibility Optimization
  React.useEffect(() => {
    const handleVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 5. Route Change Interrupt Guard
  React.useEffect(() => {
    if (pathname !== lastRouteRef.current) {
      lastRouteRef.current = pathname;
      setShowLabel(false);
      setIsEmptyState(false);
      
      if (currentConfig.href) {
        setSafeTimeout('flash_trigger', () => setShowLabel(true), 50);
        setSafeTimeout('flash_clear', () => setShowLabel(false), 1050);
      }
    }
  }, [pathname, currentConfig.href]);

  // 6. Hardened Interaction Control
  const handleClick = () => {
    if (isLocked.current) return;
    isLocked.current = true;
    
    try {
      triggerHaptic();
      interactionCount.current++;
      
      if (isOpen) {
        setIsOpen(false);
        trackSafe('menu_closed');
      } else if (onMainClick) {
        onMainClick();
        trackSafe('external_click');
      } else {
        const isMember = user?.role === 'member';
        const hasRoleAccess = !currentConfig.role || currentConfig.role === user?.role;
        
        if (currentConfig.href && hasRoleAccess && !isMember) {
          trackSafe('direct_action', { target: currentConfig.href });
          router.push(currentConfig.href);
        } else {
          setIsOpen(true);
          broadcastThrottled('menu_opened');
          trackSafe('menu_opened');
        }
      }
    } catch (err) {
      setHasError(true);
    } finally {
      setSafeTimeout('interaction_lock', () => { isLocked.current = false; }, 200);
    }
  };


  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = React.useRef({ y: 0, time: Date.now() });

  // 1. Refined Scroll Detection
  React.useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - scrollRef.current.y);
      
      if (delta > 20) {
        setIsScrolling(true);
        setSafeTimeout('scroll_idle', () => setIsScrolling(false), getCalmDuration());
      }
      scrollRef.current = { y: currentY, time: now };
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Guidance State (Respects registry)
  const [isEmptyState, setIsEmptyState] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  React.useEffect(() => {
    const checkEmpty = () => {
      const hasEmpty = document.querySelector('.mh-empty-state') !== null;
      const sessionKey = `mh_fab_empty_${pathname}`;
      if (hasEmpty && !sessionStorage.getItem(sessionKey)) {
        setIsEmptyState(true);
        trackSafe('empty_state_guided');
        setSafeTimeout('empty_dismiss', () => setIsEmptyState(false), 3000);
        sessionStorage.setItem(sessionKey, 'true');
      }
    };
    setSafeTimeout('empty_check', checkEmpty, 800);
    const observer = new MutationObserver(checkEmpty);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  // 5. Unified State Logic
  const [isInteracting, setIsInteracting] = useState(false);
  React.useEffect(() => {
    if (isHovered || isPressed || isScrolling) {
      setIsInteracting(true);
    } else {
      setSafeTimeout('calm_period', () => setIsInteracting(false), getCalmDuration());
    }
  }, [isHovered, isPressed, isScrolling]);

  const visualState = React.useMemo((): FABVisualState => {
    if (isInteracting) return 'interacting';
    if (isOpen) return 'menu_open';
    if (isEmptyState) return 'guidance';
    if (showLabel) return 'context_flash';
    return 'idle';
  }, [isInteracting, isOpen, isEmptyState, showLabel]);

  // Hide logic
  const [isHidden, setIsHidden] = useState(false);
  React.useEffect(() => {
    const checkHidden = () => setIsHidden(document.body.classList.contains('hide-fab'));
    checkHidden();
    const observer = new MutationObserver(checkHidden);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (isHidden) return null;

  // Visual derived states
  const isContextual = !!currentConfig.href;
  
  // Context-aware glow colors (Optimized for high-contrast visibility)
  const getGlowColor = () => {
    if (pathname?.startsWith('/tasks')) return 'rgba(167, 139, 250, 0.4)'; // Violet (Vibrant)
    if (pathname?.startsWith('/events')) return 'rgba(96, 165, 250, 0.4)'; // Blue (Vibrant)
    if (pathname?.startsWith('/inventory')) return 'rgba(45, 212, 191, 0.4)'; // Teal (Vibrant)
    return 'rgba(129, 140, 248, 0.4)'; // Default Indigo (Vibrant)
  };

  const isAnimationPaused = visualState !== 'idle' || isTabHidden || isLowPower;

  // 7. Safety Fallback Guard (Neutral Tone)
  if (hasError) {
    return (
      <button 
        onClick={() => window.location.reload()}
        className="fab fixed left-1/2 bottom-8 -translate-x-1/2 w-16 h-16 rounded-full bg-slate-800 text-white flex flex-col items-center justify-center shadow-lg z-[110] border border-white/10"
      >
        <Plus size={24} className="rotate-45" />
        <span className="text-[8px] font-bold uppercase mt-1">Try Again</span>
      </button>
    );
  }

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
        className="fab fixed left-1/2 z-[110] flex flex-col-reverse items-center gap-4 pointer-events-auto"
        style={{ 
          bottom: 'calc(var(--bottom-nav-height, 4.5rem) + var(--safe-bottom, 1.5rem))',
          transform: 'translate(-50%, 50%) translateY(calc(-1 * var(--keyboard-offset, 0px))) translateY(var(--fab-optical-offset, 2px))',
          '--fab-glow-color': getGlowColor()
        } as any}
      >
        {/* State-Driven Priority Surface (Label / Tooltip) */}
        <AnimatePresence mode="wait">
          {visualState === 'context_flash' && (
            <motion.div
              key="context-flash"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 0.9, y: -4, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ 
                duration: 0.15,
                opacity: { duration: 0.15 },
                y: { duration: 0.15 },
              }}
              className="absolute bottom-20 px-4 py-2 rounded-2xl bg-indigo-600/90 text-white/90 text-xs font-bold shadow-2xl border border-white/20 whitespace-nowrap z-50 backdrop-blur-md"
            >
              {currentConfig.label}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600/90 rotate-45 border-r border-b border-white/20" />
            </motion.div>
          )}

          {visualState === 'guidance' && (
            <motion.div
              key="guidance-tooltip"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: -8, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute bottom-20 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-2xl border border-white/20 max-w-[180px] text-center z-50 backdrop-blur-md leading-tight"
            >
              Create your first {currentConfig.label.split(' ')[1] || 'item'}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45 border-r border-b border-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          id="fab-main-action"
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center relative z-20 fab-surface border border-white/10 backdrop-blur-xl transition-all duration-300",
            "animate-fab-breathing",
            isAnimationPaused && "is-paused",
            visualState === 'guidance' && "ring-4 ring-indigo-500/50 scale-105"
          )}
          style={{ boxShadow: '0 6px 24px var(--fab-glow-color)' }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerDown={() => setIsPressed(true)}
          onPointerUp={() => setIsPressed(false)}
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
                <Plus size={32} strokeWidth={2.8} className="text-white" />
              ) : (
                <ContextIcon size={32} strokeWidth={2.8} className="text-white opacity-95" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-20 flex flex-col items-center gap-5 w-max z-[60]">
              {actions.map((action) => (
                <AppLink key={action.label} href={action.href} onClick={() => setIsOpen(false)}>
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} transition={{ delay: action.delay }} className="flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 rounded-full premium-card flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_20px_rgba(99,102,241,0.3)] relative overflow-hidden text-white">
                      <action.icon size={20} strokeWidth={2} />
                    </div>
                    {/* Clean Label */}
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg premium-card">{action.label}</span>
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

