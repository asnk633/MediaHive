"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindow } from "@/contexts/WindowContext";

const PUBLIC_ROUTES = ["/login", "/auth/error", "/auth/callback"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isMaximized } = useWindow();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return; // Wait for the auth session to resolve

    if (!user && !isPublicRoute) {
      // Not authenticated → redirect to login
      router.replace("/login");
    } else if (user && isPublicRoute) {
      // If we are in the browser and the URL search params contain source=tauri,
      // or we are on the auth callback page, do not redirect to dashboard.
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("source") === "tauri" || pathname.startsWith("/auth/callback")) {
          return;
        }
      }
      // Already authenticated → redirect away from login to dashboard
      router.replace("/");
    }
  }, [user, loading, isPublicRoute, router]);

  // While resolving the session, show a full-screen loader
  if (loading) {
    return (
      <div className="w-full h-full bg-[var(--bg-primary)] relative overflow-hidden flex items-center justify-center">
        {/* Absolute-positioned card: top=36px clears the fixed Titlebar */}
        <div
          className="login-page-frame absolute overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] rounded-lg shadow-sm flex items-center justify-center"
          style={{
            top: 36,
            left: isMaximized ? 0 : 16,
            right: isMaximized ? 0 : 16,
            bottom: isMaximized ? 0 : 16,
            borderRadius: isMaximized ? 0 : undefined,
            border: isMaximized ? "none" : undefined,
            boxShadow: isMaximized ? "none" : undefined,
            zIndex: 10,
          }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative z-10">
            <div className="relative flex items-center justify-center w-16 h-16">
              <img
                src="/media-app-logo-luminous.png"
                alt="MediaHive Logo"
                className="w-12 h-12 object-contain brightness-0 invert opacity-80"
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <Loader2 size={18} className="text-[var(--accent)] animate-spin" />
              <span className="text-[var(--text-tertiary)] text-[10px] font-bold tracking-wider uppercase font-mono">
                Synchronizing Workspace Node
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in and not on a public route, show nothing while redirect fires
  if (!user && !isPublicRoute) {
    return null;
  }

  // Note: We return children here instead of null so the page doesn't go blank instantly,
  // allowing the exit transition to play when pathname changes during the redirect.
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={pathname === "/login" ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={pathname === "/login" ? { opacity: 0, scale: 1.05 } : { opacity: 0, y: 20 }}
        transition={{ duration: pathname === "/login" ? 0.4 : 0.5, ease: "easeInOut" }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
