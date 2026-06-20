"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EtheralShadow } from "@/components/ui/etheral-shadow";

const PUBLIC_ROUTES = ["/login", "/auth/error"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return; // Wait for the auth session to resolve

    if (!user && !isPublicRoute) {
      // Not authenticated → redirect to login
      router.replace("/login");
    } else if (user && isPublicRoute) {
      // Already authenticated → redirect away from login to dashboard
      router.replace("/");
    }
  }, [user, loading, isPublicRoute, router]);

  // While resolving the session, show a full-screen loader
  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#030305] p-4 flex">
        <div className="w-full h-full border border-zinc-800/80 rounded-2xl overflow-hidden relative shadow-2xl">
          <EtheralShadow
            className="w-full h-full"
            sizing="fill"
            color="rgba(20, 184, 166, 0.22)"
            animation={{ scale: 70, speed: 85 }}
            noise={{ opacity: 0.12, scale: 1.2 }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative z-10">
              <div className="relative flex items-center justify-center w-28 h-28">
                <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-xl animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-20 h-20 flex items-center justify-center"
                >
                  <img
                    src="/media-app-logo-golden.png"
                    alt="MediaHive Logo"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Loader2 size={20} className="text-teal-500 animate-spin" />
                <span className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Synchronizing Workspace Node
                </span>
              </div>
            </div>
          </EtheralShadow>
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
