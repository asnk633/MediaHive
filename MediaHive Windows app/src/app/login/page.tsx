"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionValueEvent, animate } from "framer-motion";
import {
  CheckSquare, Activity, Film, FolderOpen, MessageSquare,
  Calendar, ShieldCheck, Bell, Mail, Lock, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2, ArrowRight, Database, Cpu, Settings, Cloud, Users, User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { getDriveImageUrl } from "@/lib/driveUtils";


// Inline Custom SVGs for Google and GitHub
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#ea4335"
      d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.6 1 3.8 3.55 1.9 7.28l3.77 2.92C6.55 7.42 9.04 5.04 12 5.04z"
    />
    <path
      fill="#4285f4"
      d="M23.49 12.27c0-.82-.07-1.6-.22-2.36H12v4.51h6.44c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.89 3.39-8.57z"
    />
    <path
      fill="#fbbc05"
      d="M5.67 14.72c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L1.9 7.26C1.04 8.97.55 10.92.55 12.45s.49 3.48 1.35 5.19l3.77-2.92z"
    />
    <path
      fill="#34a853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.06 0-5.65-2.08-6.58-4.88L1.05 16.3C3.04 20.25 7.18 23 12 23z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

// Types
interface FloatingIconConfig {
  id: number;
  label: string;
  stat: string;
  icon: React.ElementType;
  color: string;
  rgb: string;
  angle: number; // in radians
  baseRadius: number; // in pixels
  isLeft: boolean;
  isBackground?: boolean;
  avatarUrl?: string;
}


const FLOATING_ICONS: FloatingIconConfig[] = [
  {
    id: 1,
    label: "Tasks",
    stat: "3 due today",
    icon: CheckSquare,
    color: "#14b8a6", // Teal
    rgb: "20,184,166",
    angle: 3.7, // Top-Left-Center (pushed upwards/rightwards)
    baseRadius: 680,
    isLeft: true
  },
  {
    id: 2,
    label: "Command Center",
    stat: "System Online",
    icon: Activity,
    color: "#06b6d4", // Cyan
    rgb: "6,182,212",
    angle: 4.4, // Top-Center-Left (vertical fill)
    baseRadius: 480,
    isLeft: true
  },
  {
    id: 3,
    label: "Assets",
    stat: "24 files synced",
    icon: Film,
    color: "#6366f1", // Indigo
    rgb: "99,102,241",
    angle: 2.6, // Middle-Left
    baseRadius: 650,
    isLeft: true
  },
  {
    id: 4,
    label: "Files",
    stat: "1.2 GB stored",
    icon: FolderOpen,
    color: "#a855f7", // Purple
    rgb: "168,85,247",
    angle: 3.1, // Far Middle-Left
    baseRadius: 420,
    isLeft: true
  },
  {
    id: 5,
    label: "Chats",
    stat: "4 unread",
    icon: MessageSquare,
    color: "#ec4899", // Pink
    rgb: "236,72,153",
    angle: 2.2, // Bottom-Left
    baseRadius: 500,
    isLeft: true
  },
  {
    id: 6,
    label: "Leave",
    stat: "1 request pending",
    icon: Calendar,
    color: "#f97316", // Orange
    rgb: "249,115,22",
    angle: 1.7, // Bottom-Center-Left (vertical fill)
    baseRadius: 460,
    isLeft: true
  },
  {
    id: 7,
    label: "Governance",
    stat: "2 active policies",
    icon: ShieldCheck,
    color: "#8b5cf6", // Violet
    rgb: "139,92,246",
    angle: 2.5, // Middle-Left-Inner
    baseRadius: 300,
    isLeft: true
  },
  {
    id: 8,
    label: "Notifications",
    stat: "5 alerts",
    icon: Bell,
    color: "#f59e0b", // Amber
    rgb: "245,158,11",
    angle: 3.8, // Top-Left-Inner
    baseRadius: 320,
    isLeft: true
  },
  // Right side icons
  {
    id: 9,
    label: "Database",
    stat: "Replica Active",
    icon: Database,
    color: "#3b82f6", // Blue
    rgb: "59,130,246",
    angle: 5.0, // Top-Right
    baseRadius: 460,
    isLeft: false
  },
  {
    id: 10,
    label: "System CPU",
    stat: "9% utilization",
    icon: Cpu,
    color: "#ef4444", // Red
    rgb: "239,68,68",
    angle: 5.6, // Far Top-Right
    baseRadius: 580,
    isLeft: false
  },
  {
    id: 11,
    label: "Settings",
    stat: "14 configs synced",
    icon: Settings,
    color: "#6b7280", // Gray
    rgb: "107,114,128",
    angle: 0.5, // Middle-Right-Inner
    baseRadius: 500,
    isLeft: false
  },
  {
    id: 12,
    label: "Cloud Sync",
    stat: "Fully backed up",
    icon: Cloud,
    color: "#0ea5e9", // Sky
    rgb: "14,165,233",
    angle: 0.0, // Far Middle-Right
    baseRadius: 620,
    isLeft: false
  },
  {
    id: 13,
    label: "Teams",
    stat: "8 members online",
    icon: Users,
    color: "#10b981", // Emerald
    rgb: "16,185,129",
    angle: 0.8, // Bottom-Right-Inner
    baseRadius: 340,
    isLeft: false
  },
  {
    id: 14,
    label: "Mail Center",
    stat: "No new mails",
    icon: Mail,
    color: "#84cc16", // Lime
    rgb: "132,204,22",
    angle: 0.8, // Bottom-Right
    baseRadius: 680,
    isLeft: false
  },
  {
    id: 15,
    label: "Security Keys",
    stat: "Fully encrypted",
    icon: Lock,
    color: "#06b6d4", // Cyan
    rgb: "6,182,212",
    angle: 1.3, // Far Bottom-Right
    baseRadius: 580,
    isLeft: false
  },
  {
    id: 16,
    label: "Shared Calendar",
    stat: "Next event 3PM",
    icon: Calendar,
    color: "#f43f5e", // Rose
    rgb: "244,63,94",
    angle: 6.0, // Top-Right-Inner
    baseRadius: 350,
    isLeft: false
  },
  {
    id: 17,
    label: "Background Node 1",
    stat: "",
    icon: Cpu,
    color: "#ef4444",
    rgb: "239,68,68",
    angle: 3.0,
    baseRadius: 720,
    isLeft: true,
    isBackground: true
  },
  {
    id: 18,
    label: "Background Node 2",
    stat: "",
    icon: Database,
    color: "#3b82f6",
    rgb: "59,130,246",
    angle: 4.1,
    baseRadius: 660,
    isLeft: true,
    isBackground: true
  },
  {
    id: 19,
    label: "Background Node 3",
    stat: "",
    icon: Cloud,
    color: "#0ea5e9",
    rgb: "14,165,233",
    angle: 1.9,
    baseRadius: 680,
    isLeft: true,
    isBackground: true
  },
  {
    id: 20,
    label: "Background Node 4",
    stat: "",
    icon: ShieldCheck,
    color: "#8b5cf6",
    rgb: "139,92,246",
    angle: 2.6,
    baseRadius: 750,
    isLeft: true,
    isBackground: true
  },
  {
    id: 21,
    label: "Background Node 5",
    stat: "",
    icon: CheckSquare,
    color: "#14b8a6",
    rgb: "20,184,166",
    angle: 5.3,
    baseRadius: 740,
    isLeft: false,
    isBackground: true
  },
  {
    id: 22,
    label: "Background Node 6",
    stat: "",
    icon: Bell,
    color: "#f59e0b",
    rgb: "245,158,11",
    angle: 6.1,
    baseRadius: 670,
    isLeft: false,
    isBackground: true
  },
  {
    id: 23,
    label: "Background Node 7",
    stat: "",
    icon: Mail,
    color: "#84cc16",
    rgb: "132,204,22",
    angle: 0.5,
    baseRadius: 730,
    isLeft: false,
    isBackground: true
  },
  {
    id: 24,
    label: "Background Node 8",
    stat: "",
    icon: FolderOpen,
    color: "#a855f7",
    rgb: "168,85,247",
    angle: 1.1,
    baseRadius: 710,
    isLeft: false,
    isBackground: true
  }
];

const buttonParticles = [
  { x: 10, y: 20, duration: 1.5, delay: 0.1, size: 0.2, originX: 400, originY: 300 },
  { x: 80, y: 10, duration: 2.1, delay: 0.3, size: 0.25, originX: -300, originY: 500 },
  { x: 50, y: 80, duration: 1.8, delay: 0.5, size: 0.15, originX: 200, originY: -400 },
  { x: 20, y: 70, duration: 1.2, delay: 0.2, size: 0.3, originX: -500, originY: -300 },
  { x: 90, y: 60, duration: 2.5, delay: 0.4, size: 0.2, originX: 600, originY: 400 },
  { x: 30, y: 40, duration: 1.7, delay: 0.1, size: 0.18, originX: -400, originY: 200 },
  { x: 70, y: 30, duration: 2.3, delay: 0.6, size: 0.22, originX: 500, originY: -500 },
  { x: 40, y: 90, duration: 1.4, delay: 0.3, size: 0.28, originX: 300, originY: 600 },
  { x: 60, y: 50, duration: 1.9, delay: 0.2, size: 0.16, originX: -200, originY: -200 },
  { x: 85, y: 85, duration: 2.2, delay: 0.7, size: 0.24, originX: 450, originY: -450 },
];


// Single floating, cursor-repelling coin component
const Icon = ({
  mouseX,
  mouseY,
  mousePos,
  iconData,
  index,
  showLoginForm,
  isAnyNodeHovered,
  hoveredNode,
  setHoveredNode,
  scaleFactor,
  loading
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  mousePos: { x: number; y: number };
  iconData: FloatingIconConfig;
  index: number;
  showLoginForm: boolean;
  isAnyNodeHovered: boolean;
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
  scaleFactor: number;
  loading: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glow = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });
  const springGlow = useSpring(glow, { stiffness: 100, damping: 15 });
 
  useEffect(() => {
    // Background coins are non-interactive and do not repel or glow
    if (iconData.isBackground) return;

    const handleMouseMove = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const iconCenterX = rect.left + rect.width / 2;
        const iconCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX.current - iconCenterX, 2) +
          Math.pow(mouseY.current - iconCenterY, 2)
        );

        // Neon glow proximity intensity (up to 240px distance)
        if (distance < 240) {
          glow.set(1 - distance / 240);
        } else {
          glow.set(0);
        }
 
        if (distance < 180 && !showLoginForm) {
          const angle = Math.atan2(
            mouseY.current - iconCenterY,
            mouseX.current - iconCenterX
          );
          // Repel away from cursor (stronger closer)
          const force = (1 - distance / 180) * 55 * scaleFactor;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
        } else {
          x.set(0);
          y.set(0);
        }
      }
    };
 
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y, glow, mouseX, mouseY, scaleFactor, iconData.isBackground, showLoginForm]);
 
  const isHovered = !iconData.isBackground && hoveredNode === String(iconData.id);
  const specX = 50 + (mouseX.current / (typeof window !== "undefined" ? window.innerWidth : 1000) - 0.5) * 60;
  const specY = 50 + (mouseY.current / (typeof window !== "undefined" ? window.innerHeight : 1000) - 0.5) * 60;
  const coinSize = 82 * scaleFactor * (iconData.isBackground ? 0.6 : 1.0);
 
  // 3D parallax displacement: foreground shifts by up to 10px, background by 4px (disabled on sign-in page to keep orbits perfectly stable)
  const parallaxX = showLoginForm ? 0 : mousePos.x * (iconData.isBackground ? 4 : 10) * scaleFactor;
  const parallaxY = showLoginForm ? 0 : mousePos.y * (iconData.isBackground ? 4 : 10) * scaleFactor;

  // Smoothly colorize the coin border based on mouse proximity
  const borderColor = useTransform(
    springGlow,
    [0, 1],
    ["rgba(255,255,255,0.06)", `rgba(${iconData.rgb}, 0.4)`]
  );

  // Smoothly blend outer shadows to create a neon bloom based on mouse proximity
  const boxShadow = useTransform(
    springGlow,
    [0, 1],
    [
      "0 10px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)",
      `0 15px 35px rgba(${iconData.rgb}, 0.15), 0 0 15px rgba(${iconData.rgb}, 0.08), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)`
    ]
  );


  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
        zIndex: isHovered ? 40 : iconData.isBackground ? 5 : 10,
        marginLeft: -coinSize / 2,
        marginTop: -coinSize / 2,
        width: coinSize,
        height: coinSize,
      }}
      className={iconData.isBackground ? "pointer-events-none" : "cursor-pointer"}
      onMouseEnter={iconData.isBackground ? undefined : () => setHoveredNode(String(iconData.id))}
      onMouseLeave={iconData.isBackground ? undefined : () => setHoveredNode(null)}
    >
      <motion.div
        style={{
          x: springX,
          y: springY,
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: loading 
            ? 0 
            : iconData.isBackground
              ? isAnyNodeHovered
                ? 0.15
                : 0.28
              : isAnyNodeHovered && !isHovered 
                ? 0.4 
                : 1,
          scale: loading 
            ? 0 
            : isHovered 
              ? 1.15 
              : isAnyNodeHovered 
                ? 0.9 
                : 1,
        }}
        transition={{
          delay: index * 0.04, // snappy staggered pop
          type: "spring",
          stiffness: 110,
          damping: 12,
        }}
      >
        {/* Organic slow floating drift loop */}
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            position: "relative"
          }}
          animate={{
            y: [0, -6, 0, 6, 0],
            x: [0, 4, 0, -4, 0],
            rotate: [0, 3, 0, -3, 0],
          }}
          transition={{
            duration: (6 + (iconData.id % 4) * 1.5) * (iconData.isBackground ? 1.5 : 1.0),
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {/* Dynamic Proximity Neon Glow Aura (fades out for background nodes) */}
          {!iconData.isBackground && (
            <motion.div
              style={{
                position: "absolute",
                inset: "-30%",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, rgba(${iconData.rgb}, 0.22) 0%, rgba(${iconData.rgb}, 0.05) 50%, transparent 70%)`,
                opacity: springGlow,
                pointerEvents: "none",
                zIndex: -1,
              }}
            />
          )}

          <motion.div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "radial-gradient(circle at center, rgba(15,15,20,0.85) 0%, rgba(8,8,10,0.98) 100%)",
              border: "1.5px solid",
              borderColor: isHovered ? iconData.color : borderColor,
              boxShadow: isHovered 
                ? `0 20px 45px rgba(${iconData.rgb}, 0.25), 0 0 25px rgba(${iconData.rgb}, 0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.5)`
                : boxShadow,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.2s ease",
            }}
          >
            {/* Central Node Backlight */}
            <div
              style={{
                position: "absolute",
                inset: "-20%",
                background: `radial-gradient(circle at center, rgba(${iconData.rgb}, 0.1) 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* Icon element or avatar image */}
            {iconData.avatarUrl && !imgError ? (
              <img
                src={iconData.avatarUrl}
                alt={iconData.label}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover rounded-full transition-transform duration-300"
                style={{
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              />
            ) : showLoginForm ? (
              <div 
                className="w-full h-full rounded-full flex items-center justify-center font-bold select-none text-white/90"
                style={{
                  background: `linear-gradient(135deg, rgba(${iconData.rgb}, 0.28) 0%, rgba(${iconData.rgb}, 0.05) 100%)`,
                  color: iconData.color,
                  fontSize: 20 * scaleFactor,
                  textShadow: `0 0 8px ${iconData.color}`
                }}
              >
                {iconData.label ? iconData.label.charAt(0).toUpperCase() : "U"}
              </div>
            ) : (
              <iconData.icon 
                size={26 * scaleFactor} 
                style={{ 
                  color: isHovered ? iconData.color : "rgba(255,255,255,0.7)",
                  filter: isHovered ? `drop-shadow(0 0 8px ${iconData.color})` : "none",
                  transition: "all 0.2s ease",
                }} 
              />
            )}

            {/* Specular Glare */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at ${specX}% ${specY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                pointerEvents: "none",
                mixBlendMode: "overlay",
                zIndex: 10,
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: coinSize + 10,
              left: "50%",
              x: "-50%",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 50,
            }}
            className="flex flex-col items-center"
          >
            {/* Arrow pointing up */}
            <div className="w-1.5 h-1.5 bg-[#0b0c10] border-l border-t border-zinc-800 rotate-45 z-10 -mb-[4px]" />
            
            {/* Text container */}
            <div className="bg-[#0b0c10]/95 border border-zinc-800 text-white rounded-lg px-2.5 py-1.5 shadow-2xl flex flex-col items-center">
              <span className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: iconData.color }}>{iconData.label}</span>
              {iconData.stat && (
                <span className="text-[9px] text-zinc-400 font-medium tracking-wide mt-0.5">{iconData.stat}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [userCoins, setUserCoins] = useState<FloatingIconConfig[]>([]);

  // Dynamically group user profile coins into concentric orbits (innermost 2, next 3, next 4, next 5, next 6, next 7, next 8)
  const getUserOrbits = (coins: FloatingIconConfig[]) => {
    const orbits: FloatingIconConfig[][] = [];
    const tempCoins = [...coins];
    let size = 2; // start with 2 in the innermost orbit
    
    while (tempCoins.length > 0) {
      orbits.push(tempCoins.splice(0, size));
      size = Math.min(size + 1, 8); // gradually increase orbit capacity up to 8
    }
    return orbits;
  };

  // Fetch real user profiles from Supabase to construct orbits on sign-in page
  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase environment variables are missing");
        }

        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch profiles: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        if (data) {
          const profileColors = [
            { color: "#14b8a6", rgb: "20,184,166" }, // Teal
            { color: "#06b6d4", rgb: "6,182,212" }, // Cyan
            { color: "#6366f1", rgb: "99,102,241" }, // Indigo
            { color: "#a855f7", rgb: "168,85,247" }, // Purple
            { color: "#ec4899", rgb: "236,72,153" }, // Pink
            { color: "#f97316", rgb: "249,115,22" },  // Orange
            { color: "#8b5cf6", rgb: "139,92,246" }, // Violet
            { color: "#3b82f6", rgb: "59,130,246" }  // Blue
          ];

          const realProfiles = data.filter((profile: any) => {
            const name = (profile.full_name || "").toLowerCase();
            const email = (profile.email || "").toLowerCase();
            return !name.includes("test") && !email.includes("testuser") && !email.includes("example.com");
          });

          const mapped = realProfiles.map((profile: any, idx: number) => {
            const colorObj = profileColors[idx % profileColors.length];
            return {
              id: 100 + idx,
              label: profile.full_name || "User",
              stat: profile.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : "Member",
              icon: User,
              color: colorObj.color,
              rgb: colorObj.rgb,
              angle: 0,
              baseRadius: 0,
              isLeft: false,
              avatarUrl: getDriveImageUrl(profile.avatar_url, profile.avatar_drive_id, true),
            };
          });
          setUserCoins(mapped);
        }
      } catch (err: any) {
        console.error("Error fetching real users for login screen orbits:", err);
        setDbError(err.message || String(err));
      }
    };
    fetchRealUsers();
  }, []);
  
  // Track transition state to enable layoutId only during transitions, preventing orbit jitter
  const [isTransitioning, setIsTransitioning] = useState(false);
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showLoginForm]);

  const [authMode, setAuthMode] = useState<"gate" | "login" | "signup" | "forgot">("gate");
  const [email, setEmail] = useState("");
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const boxTransition = {
    type: "spring" as const,
    stiffness: 110,
    damping: 18,
    mass: 1.0,
  };

  const box1Variants = {
    collapsed: {
      width: 140,
      height: 140,
      top: -70,
      right: -70,
      borderRadius: "50%",
      transition: boxTransition,
    },
    expanded: {
      width: "100%",
      height: "100%",
      top: 0,
      right: 0,
      borderRadius: "16px",
      transition: boxTransition,
    },
  };

  const box2Variants = {
    collapsed: {
      width: 180,
      height: 180,
      top: -90,
      right: -90,
      borderRadius: "50%",
      transition: boxTransition,
    },
    expanded: {
      width: "100%",
      height: "100%",
      top: 0,
      right: 0,
      borderRadius: "16px",
      transition: boxTransition,
    },
  };

  const box3Variants = {
    collapsed: {
      width: 220,
      height: 220,
      top: -110,
      right: -110,
      borderRadius: "50%",
      transition: boxTransition,
    },
    expanded: {
      width: "100%",
      height: "100%",
      top: 0,
      right: 0,
      borderRadius: "16px",
      transition: boxTransition,
    },
  };
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ w: 1920, h: 1080 });

  const mouseX = useRef(0);
  const mouseY = useRef(0);

  // Mount Hydration Guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Window size tracking for adaptive scaling
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    mouseX.current = e.clientX;
    mouseY.current = e.clientY;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const renderOrbit = (
    coins: FloatingIconConfig[],
    radius: number,
    duration: number,
    direction: "clockwise" | "counter-clockwise",
    orbitIndex: number
  ) => {
    const isClockwise = direction === "clockwise";
    return (
      <motion.div
        key={`orbit-${orbitIndex}`}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ 
          opacity: 1,
          rotate: isClockwise ? 360 : -360
        }}
        transition={{ 
          opacity: { duration: 1.5, delay: 0.2 * orbitIndex },
          rotate: { duration: duration, repeat: Infinity, ease: "linear" }
        }}
        className="absolute border border-dashed border-white/5 rounded-full flex items-center justify-center pointer-events-none"
        style={{
          width: radius * 2,
          height: radius * 2,
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          zIndex: 1,
        }}
      >
        {coins.map((iconData, i) => {
          const angle = (360 / coins.length) * i;
          return (
            <div
              key={iconData.id}
              className="absolute pointer-events-auto"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
              }}
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isClockwise ? -360 : 360 }}
                transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 0,
                  height: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <motion.div layoutId={(!showLoginForm || isTransitioning) ? `coin-${iconData.id}` : undefined}>
                  <Icon
                    mouseX={mouseX}
                    mouseY={mouseY}
                    mousePos={mousePos}
                    iconData={iconData}
                    index={i + orbitIndex * 10}
                    showLoginForm={showLoginForm}
                    isAnyNodeHovered={hoveredNode !== null}
                    hoveredNode={hoveredNode}
                    setHoveredNode={setHoveredNode}
                    scaleFactor={scaleFactor}
                    loading={loading}
                  />
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
          },
        },
      });
      if (signUpError) throw signUpError;
      
      // Successfully registered. Switch to login mode
      setAuthMode("login");
      setError("Account created successfully! You can now sign in.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccessMessage("Reset instructions sent! Check your inbox.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="w-screen h-screen bg-[#030305]" />;
  }

  // When showLoginForm is true, the left panel width is 58.33% of the window width
  const currentPanelWidth = showLoginForm ? windowSize.w * 0.583333 : windowSize.w;

  // Adaptive scaling ratio based on Left Panel dimensions (1920x1080 standard desktop base)
  // Scales all text, coin dimensions, and layout distances proportionally in sync
  const scaleFactor = Math.max(Math.min(currentPanelWidth / 1920, windowSize.h / 1080), 0.55);

  const innerRadius = 370 * scaleFactor;
  const outerRadius = currentPanelWidth * 0.82;
  const orbitGap = (outerRadius - innerRadius) / 6;

  const getOrbitRadius = (index: number) => {
    return innerRadius + (index - 1) * orbitGap;
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden font-sans select-none p-4 bg-[#030305] relative">
      
      {/* ── Outer desktop frame border wrapper ── */}
      <div className="w-full h-full border border-zinc-800/80 rounded-2xl overflow-hidden flex relative shadow-2xl">
        
        {/* Top desktop window style bar */}
        <div className="absolute top-0 inset-x-0 h-10 border-b border-white/5 flex items-center justify-between px-6 z-50 pointer-events-none">
          <span className="text-[10px] text-zinc-500 font-bold tracking-[0.15em] uppercase">MediaHive Desktop v2.1</span>
        </div>

        {/* Dynamic gritty background noise filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] mix-blend-overlay z-0">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Outer Interaction Wrapper with Ethereal Shadow */}
        <EtheralShadow
          className="w-full h-full"
          sizing="fill"
          color="rgba(20, 184, 166, 0.22)" // Teal accent shadow overlay
          animation={{ scale: 70, speed: 85 }}
          noise={{ opacity: 0.12, scale: 1.2 }}
        >
          <div
            onMouseMove={handleGlobalMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full flex relative overflow-hidden"
          >
          {/* Parallax space lines / grid background */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none z-1"
            style={{
              backgroundImage: `
                radial-gradient(circle, #fff 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "4px 4px, 40px 40px, 40px 40px",
              transform: `translate3d(${mousePos.x * 10}px, ${mousePos.y * 10}px, 0)`,
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />

          {/* Concentric Orbiting Rings Background (behind centerpiece text, in same Left Panel container to slide with it) */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{
              width: showLoginForm ? "58.333333%" : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 18,
            }}
            className="h-full flex items-center justify-center relative overflow-visible z-5"
            style={{ perspective: 1000 }}
          >
            {showLoginForm ? (
              /* Concentric Orbiting Rings (z-index 1, centered at right-edge of Left Panel) */
              <div
                style={{
                  position: "absolute",
                  left: "100%",
                  top: "50%",
                  width: 0,
                  height: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
                className="select-none"
              >
                {/* Brand Logo Pulse Ripple Background */}
                <div className="logo-ripple-container">
                  <div className="box" />
                  <div className="box" />
                  <div className="box" />
                </div>

                {getUserOrbits(userCoins.length > 0 ? userCoins : FLOATING_ICONS.slice(0, 12)).reverse().map((orbitCoins, reverseIdx, arr) => {
                  const orbitNumber = arr.length - reverseIdx;
                  const radius = getOrbitRadius(orbitNumber);
                  const duration = 40 + (orbitNumber - 1) * 16;
                  const direction = orbitNumber % 2 === 0 ? "counter-clockwise" : "clockwise";
                  return renderOrbit(orbitCoins, radius, duration, direction, orbitNumber);
                })}

                {/* Semicircular Brand Logo Badge on the border edge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: 560 * scaleFactor,
                    height: 560 * scaleFactor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    className="opacity-95 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                    style={{
                      transform: "translateX(0px)",
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [-3, 3, -3] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        width: 352 * scaleFactor,
                        height: 352 * scaleFactor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src="/media-app-logo-luminous.png"
                        alt="MediaHive Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                          filter: "brightness(0) invert(1)",
                          opacity: 1,
                        }}
                        className="object-contain"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Scattered Interactive Coins Layer (z-index 1, below text) */
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1] overflow-hidden select-none">
                {FLOATING_ICONS.map((iconData, index) => {
                  const nx = Math.cos(iconData.angle) * iconData.baseRadius * scaleFactor;
                  const ny = Math.sin(iconData.angle) * iconData.baseRadius * scaleFactor;
                  return (
                    <div
                      key={iconData.id}
                      className="absolute pointer-events-auto"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) translate3d(${nx}px, ${ny}px, 0)`,
                      }}
                    >
                      <motion.div layoutId={(!showLoginForm || isTransitioning) ? `coin-${iconData.id}` : undefined}>
                        <Icon
                          mouseX={mouseX}
                          mouseY={mouseY}
                          mousePos={mousePos}
                          iconData={iconData}
                          index={index}
                          showLoginForm={showLoginForm}
                          isAnyNodeHovered={hoveredNode !== null}
                          hoveredNode={hoveredNode}
                          setHoveredNode={setHoveredNode}
                          scaleFactor={scaleFactor}
                          loading={loading}
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back Button to return to Welcome view when login form is open */}
            {showLoginForm && (
              <button
                type="button"
                onClick={() => {
                  if (authMode !== "gate") {
                    setAuthMode("gate");
                    setError(null);
                  } else {
                    setShowLoginForm(false);
                  }
                }}
                className="absolute top-14 left-6 z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950/60 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Back</span>
              </button>
            )}

            {dbError && (
              <div className="absolute bottom-6 left-6 z-40 max-w-xs px-3 py-2 rounded bg-red-950/50 border border-red-800 text-[10px] font-mono text-red-400 select-text">
                DB Error: {dbError}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!showLoginForm ? (
                /* ─── FULL-SCREEN WELCOME CARD VIEW ─── */
                <motion.div
                  key="welcome-hero"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 12 },
                    visible: { 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1
                      }
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.95, 
                    y: -12,
                    transition: { duration: 0.22, ease: "easeOut" }
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 80,
                    damping: 18
                  }}
                  className="max-w-2xl px-6 flex flex-col items-center justify-center text-center relative z-20 pointer-events-none"
                >
                  {/* Decorative welcome logo */}
                  <div 
                    className="opacity-90 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    style={{
                      marginBottom: `${Math.max(12, 24 * scaleFactor)}px`,
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 150,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{
                        width: Math.max(50, 110 * scaleFactor),
                        height: Math.max(50, 110 * scaleFactor),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src="/media-app-logo-golden.png"
                        alt="MediaHive Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        className="object-contain"
                      />
                    </motion.div>
                  </div>

                  <h1 
                    className="font-black tracking-tight text-white uppercase m-0 leading-tight"
                    style={{
                      fontFamily: "var(--font-sans)",
                      textShadow: "0 2px 20px rgba(255,255,255,0.18)",
                      fontSize: `${Math.max(20, 60 * scaleFactor)}px`,
                    }}
                  >
                    Welcome to MediaHive
                  </h1>
                  
                  <p 
                    className="mx-auto text-zinc-400 leading-relaxed font-sans"
                    style={{
                      marginTop: `${Math.max(12, 24 * scaleFactor)}px`,
                      fontSize: `${Math.max(10, 15 * scaleFactor)}px`,
                      maxWidth: `${Math.max(360, 640 * scaleFactor)}px`
                    }}
                  >
                    Your fully synchronized workspace ecosystem. Seamlessly manage pipelines, communication, and digital assets.
                  </p>

                  <div style={{ marginTop: `${Math.max(20, 40 * scaleFactor)}px` }} className="pointer-events-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setShowLoginForm(true);
                        setAuthMode("gate");
                        setError(null);
                      }}
                      className="relative group overflow-hidden rounded-full px-8 py-3.5 font-semibold tracking-wide text-white shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)] transition-all duration-500 hover:shadow-[0_0_60px_-15px_rgba(20,184,166,0.5)] border border-teal-500/20 hover:border-teal-400/40 bg-teal-500/10 backdrop-blur-md flex items-center justify-center"
                      style={{
                        fontSize: `${Math.max(12, 16 * scaleFactor)}px`,
                        minWidth: `${Math.max(160, 220 * scaleFactor)}px`
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Enter Workspace
                        <svg className="w-5 h-5 text-teal-300 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      {/* Button inner glow and hover effects */}
                      <div className="absolute inset-0 z-0 bg-gradient-to-r from-teal-500/0 via-teal-400/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT CONTAINER: Sleek tactile glassmorphic form card
              ═══════════════════════════════════════════════════════════════ */}
          {/* ═══════════════════════════════════════════════════════════════
              RIGHT CONTAINER: Sleek tactile glassmorphic form card
              ═══════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showLoginForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 18
                }}
                style={{ perspective: 1200, width: "41.666667%", minWidth: "320px" }}
                className="h-full flex items-center justify-center p-6 lg:p-12 absolute right-0 top-0 bg-[#040406] border-l border-zinc-900/60 z-20 overflow-y-auto"
              >
                {/* Subtle mobile ambient glows */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(20,184,166,0.04),transparent_60%)] pointer-events-none z-0" />
                
                {/* Shooting Stars & Stars Background */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-70">
                  <StarsBackground />
                  <ShootingStars />
                </div>

                {/* Paper Stack Wrapper — cloth physics via keyframes, no ghost DOM layers */}
                <div className="relative w-full max-w-sm z-10" style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}>

                  <div 
                    className="relative w-full max-w-sm h-[530px] rounded-2xl overflow-hidden bg-zinc-950/75 border border-zinc-800/80 shadow-2xl backdrop-blur-xl select-text cursor-default flex flex-col justify-between p-0"
                  >
                    {/* Concentric Circles Stacked in the Top-Right Corner */}
                    
                    {/* Box 3: Reset Password (Sky Gradient) */}
                    <motion.div
                      variants={box3Variants}
                      animate={authMode === "forgot" ? "expanded" : "collapsed"}
                      whileHover={authMode === "gate" ? { scale: 1.025 } : undefined}
                      onClick={() => authMode === "gate" && setAuthMode("forgot")}
                      style={{
                        position: "absolute",
                        zIndex: authMode === "forgot" ? 30 : 18,
                        background: "linear-gradient(-45deg, #0ea5e9 0%, #1e3a8a 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(14,165,233,0.1)",
                        cursor: authMode === "gate" ? "pointer" : "default",
                      }}
                      className="border border-white/10"
                    >
                      {authMode === "forgot" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.26, duration: 0.35 }}
                          className="w-full h-full p-8 flex flex-col justify-between select-text relative text-white"
                        >
                          {/* Back Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuthMode("gate");
                              setError(null);
                              setSuccessMessage(null);
                            }}
                            className="absolute top-6 left-6 flex items-center gap-1 text-[10px] font-bold text-white/75 hover:text-white uppercase tracking-wider bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors"
                          >
                            <span>←</span> <span>Back</span>
                          </button>

                          <div className="flex flex-col gap-1.5 pt-12">
                            <h2 className="text-xl font-black tracking-tight text-white m-0 uppercase">
                              Reset Password
                            </h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider m-0">
                              Recover your node access credentials
                            </p>
                          </div>

                          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                            {error && (
                              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-[11px] font-medium">
                                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                              </div>
                            )}

                            {successMessage && (
                              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-[11px] font-medium">
                                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                <span>{successMessage}</span>
                              </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                Email Address
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="you@mediahive.io"
                                  className="w-full rounded-xl px-4 py-3 pl-11 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading || !email}
                              className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 disabled:bg-white/50 font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                              {loading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Recovering...</span>
                                </>
                              ) : (
                                <>
                                  <span>Send Recovery Link</span>
                                  <ArrowRight size={13} />
                                </>
                              )}
                            </button>
                          </form>

                          <div className="text-center text-[10px] pt-1">
                            <span className="text-white/60 font-medium">Remembered password? </span>
                            <button 
                              type="button" 
                              onClick={() => { setAuthMode("login"); setError(null); setSuccessMessage(null); }}
                              className="text-white hover:underline font-bold transition-all cursor-pointer"
                            >
                              Sign in
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Box 2: Sign Up (Indigo Gradient) */}
                    <motion.div
                      variants={box2Variants}
                      animate={authMode === "signup" ? "expanded" : "collapsed"}
                      whileHover={authMode === "gate" ? { scale: 1.025 } : undefined}
                      onClick={() => authMode === "gate" && setAuthMode("signup")}
                      style={{
                        position: "absolute",
                        zIndex: authMode === "signup" ? 30 : 19,
                        background: "linear-gradient(-45deg, #4f46e5 0%, #312e81 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(79,70,229,0.1)",
                        cursor: authMode === "gate" ? "pointer" : "default",
                      }}
                      className="border border-white/10"
                    >
                      {authMode === "signup" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.26, duration: 0.35 }}
                          className="w-full h-full p-8 flex flex-col justify-between select-text relative text-white"
                        >
                          {/* Back Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuthMode("gate");
                              setError(null);
                            }}
                            className="absolute top-6 left-6 flex items-center gap-1 text-[10px] font-bold text-white/75 hover:text-white uppercase tracking-wider bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors"
                          >
                            <span>←</span> <span>Back</span>
                          </button>

                          <div className="flex flex-col gap-1.5 pt-10">
                            <h2 className="text-xl font-black tracking-tight text-white m-0 uppercase">
                              Create Account
                            </h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider m-0">
                              Setup your developer profile node
                            </p>
                          </div>

                          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                            {error && (
                              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-[11px] font-medium">
                                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                              </div>
                            )}

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                Full Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type="text"
                                  required
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  placeholder="Alex Mercer"
                                  className="w-full rounded-xl px-4 py-2.5 pl-11 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                Email Address
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type="email"
                                  required
                                  autoComplete="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="you@mediahive.io"
                                  className="w-full rounded-xl px-4 py-2.5 pl-11 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                Password
                              </label>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  className="w-full rounded-xl px-4 py-2.5 pl-11 pr-10 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  required
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  className="w-full rounded-xl px-4 py-2.5 pl-11 pr-10 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={loading || !email || !password || !fullName || !confirmPassword}
                              className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 disabled:bg-white/50 font-bold text-xs py-3 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                              {loading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Deploying...</span>
                                </>
                              ) : (
                                <>
                                  <span>Register Node</span>
                                  <ArrowRight size={13} />
                                </>
                              )}
                            </button>
                          </form>

                          <div className="text-center text-[10px] pt-1">
                            <span className="text-white/60 font-medium">Already have an account? </span>
                            <button 
                              type="button" 
                              onClick={() => { setAuthMode("login"); setError(null); }}
                              className="text-white hover:underline font-bold transition-all cursor-pointer"
                            >
                              Sign in
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Box 1: Sign In (Teal Gradient) */}
                    <motion.div
                      variants={box1Variants}
                      animate={authMode === "login" ? "expanded" : "collapsed"}
                      whileHover={authMode === "gate" ? { scale: 1.025 } : undefined}
                      onClick={() => authMode === "gate" && setAuthMode("login")}
                      style={{
                        position: "absolute",
                        zIndex: authMode === "login" ? 30 : 20,
                        background: "linear-gradient(-45deg, #0d9488 0%, #115e59 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(20,184,166,0.1)",
                        cursor: authMode === "gate" ? "pointer" : "default",
                      }}
                      className="border border-white/10"
                    >
                      {authMode === "login" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.26, duration: 0.35 }}
                          className="w-full h-full p-8 flex flex-col justify-between select-text relative text-white"
                        >
                          {/* Back Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuthMode("gate");
                              setError(null);
                            }}
                            className="absolute top-6 left-6 flex items-center gap-1 text-[10px] font-bold text-white/75 hover:text-white uppercase tracking-wider bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors"
                          >
                            <span>←</span> <span>Back</span>
                          </button>

                          <div className="flex flex-col gap-1.5 pt-10">
                            <h2 className="text-xl font-black tracking-tight text-white m-0 uppercase">
                              Welcome Back
                            </h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider m-0">
                              Sign in to your workspace node
                            </p>
                          </div>

                          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            {error && (
                              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-[11px] font-medium">
                                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                              </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                Email Address
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type="email"
                                  required
                                  autoComplete="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="you@mediahive.io"
                                  className="w-full rounded-xl px-4 py-2.5 pl-11 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                                  Password
                                </label>
                                <button 
                                  type="button" 
                                  onClick={() => setAuthMode("forgot")}
                                  className="text-[9px] text-white hover:underline font-bold transition-all cursor-pointer"
                                >
                                  Forgot password?
                                </button>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  required
                                  autoComplete="current-password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••••••"
                                  className="w-full rounded-xl px-4 py-2.5 pl-11 pr-10 text-xs text-white placeholder:text-white/40 bg-black/20 border border-white/10 focus:outline-none focus:border-white focus:ring-4 focus:ring-white/5 transition-all shadow-sm font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((prev) => !prev)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors cursor-pointer"
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 py-0.5">
                              <input
                                type="checkbox"
                                id="rememberMe"
                                className="rounded border-white/20 bg-black/20 text-white focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                              />
                              <label htmlFor="rememberMe" className="text-[9px] text-white/70 font-bold uppercase tracking-wider cursor-pointer select-none">
                                Remember me
                              </label>
                            </div>

                            <button
                              type="submit"
                              disabled={loading || !email || !password}
                              className="mt-1 w-full flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 disabled:bg-white/50 font-bold text-xs py-3 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                              {loading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  <span>Synchronizing Core...</span>
                                </>
                              ) : (
                                <>
                                  <span>Sign In</span>
                                  <ArrowRight size={13} />
                                </>
                              )}
                            </button>
                          </form>

                          <div className="flex items-center my-1">
                            <div className="flex-grow h-px bg-white/10" />
                            <span className="text-[8px] text-white/50 font-bold uppercase px-3 tracking-widest">or</span>
                            <div className="flex-grow h-px bg-white/10" />
                          </div>

                           <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={handleGoogleLogin}
                              disabled={loading}
                              className="w-full flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 disabled:bg-white/5 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer bg-white/10 shadow-sm disabled:cursor-not-allowed"
                            >
                              {loading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <GoogleIcon />
                              )}
                              <span>Sign in with Google</span>
                            </button>
                          </div>

                          <div className="text-center text-[10px] pt-1">
                            <span className="text-white/60 font-medium">Don't have an account? </span>
                            <button 
                              type="button" 
                              onClick={() => { setAuthMode("signup"); setError(null); }}
                              className="text-white hover:underline font-bold transition-all cursor-pointer"
                            >
                              Sign up
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Master/Gate Card Container Content */}
                    <motion.div
                      animate={{
                        opacity: authMode === "gate" ? 1 : 0,
                        scale: authMode === "gate" ? 1 : 0.95,
                        y: authMode === "gate" ? 0 : -10,
                      }}
                      transition={{ duration: 0.25 }}
                      style={{
                        zIndex: 25,
                        position: "relative",
                        pointerEvents: authMode === "gate" ? "auto" : "none",
                        height: "100%",
                      }}
                      className="w-full h-full flex flex-col justify-between select-text p-8"
                    >
                      <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-black tracking-tight text-white m-0 uppercase">
                          Access Workspace
                        </h2>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider m-0">
                          Connecting to MediaHive Secure Node
                        </p>
                      </div>

                      <div className="flex flex-col gap-4 flex-grow justify-center py-4">
                        <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                          Please verify your credentials or create a new developer profile to deploy your workspace node.
                        </p>

                        <div className="flex flex-col gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => { setAuthMode("login"); setError(null); }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:brightness-110 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-[#14b8a6]/10 hover:shadow-[#14b8a6]/20 cursor-pointer active:scale-[0.98]"
                          >
                            <span>Yes, Sign In</span>
                            <ArrowRight size={13} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => { setAuthMode("signup"); setError(null); }}
                            className="w-full flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 text-white font-bold text-xs py-3.5 rounded-xl transition-colors cursor-pointer"
                          >
                            <span>No, Create Account</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <button
                          type="button"
                          onClick={() => { setAuthMode("forgot"); setError(null); }}
                          className="text-[11px] text-[#0ea5e9] hover:text-[#0ea5e9]/80 font-bold transition-all cursor-pointer text-center"
                        >
                          Forgot password?
                        </button>

                        <div className="text-center text-[9px] text-zinc-500 font-medium leading-relaxed pt-4 border-t border-zinc-800/80">
                          MediaHive secure workspace access protocols are active.<br />
                          Authorized connections only.
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </EtheralShadow>
      </div>
    </div>
  );
}
