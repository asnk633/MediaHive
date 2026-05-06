"use client";
import React from "react";
import {
  Search,
  Settings,
  User,
  LogOut,
  CheckSquare,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContextProvider";
import { cn, nativeNavigate } from "@/lib/utils";
import { getDriveImageUrl } from "@/lib/driveUtils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { HealthIndicator } from "@/components/common/HealthIndicator";
import { useOffline } from "@/client/hooks/useOffline";
import { RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientOnly from "@/components/ClientOnly";

import { usePermissions } from "@/hooks/usePermissions";

export default function TopBar({ title = "MediaHive" }: { title?: string }) {
  const { user, signOut } = useAuth();
  const { role: currentRole } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const { isOnline, isProcessing, pendingSyncCount, processSyncQueue } = useOffline();

  // Simple, human-readable titles
  const currentRouteName = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';

  return (
    <header className="fixed top-0 inset-x-0 z-[50] h-[var(--header-height)] bg-sidebar border-b border-border flex items-center justify-between px-6 shadow-tier2 lg:hidden transition-all duration-300">

      {/* 1. Mobile Branding (Strictly Mobile Only) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded bg-accent-primary flex items-center justify-center text-white text-xs font-bold">
          MH
        </div>
        <h1 className="text-sm font-semibold text-white uppercase tracking-tight">
          {title}
        </h1>
      </div>

      {/* 2. Actions & Profile */}
      <ClientOnly>
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Sync Action */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => processSyncQueue()}
                  disabled={isProcessing}
                  className={cn(
                    "relative h-10 w-10 rounded-full transition-all duration-300",
                    "hover:bg-white/5 group",
                    !isOnline || pendingSyncCount > 0 || isProcessing ? "opacity-100" : "opacity-50"
                  )}
                >
                  <RefreshCw 
                    size={18} 
                    className={cn(
                      "text-white transition-colors",
                      isProcessing && "animate-spin"
                    )} 
                  />
                  {!isOnline && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 border border-sidebar shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  )}
                  {pendingSyncCount > 0 && !isProcessing && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-indigo-500 text-[8px] font-bold flex items-center justify-center text-white border border-sidebar shadow-lg">
                      {pendingSyncCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 border-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-2xl">
                {isOnline ? (pendingSyncCount > 0 ? `Sync ${pendingSyncCount} Pending` : 'System Up to Date') : 'Offline (Changes Saved)'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-4 w-[1px] bg-border-soft mx-1" />

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <HealthIndicator />
            <NotificationBell />
          </div>

          <div className="h-4 w-[1px] bg-border-soft mx-1" />

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 rounded-full hover:bg-surface group transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface border border-border-soft flex items-center justify-center">
                  {(user?.avatar_url || user?.photoURL) ? (
                    <img src={getDriveImageUrl(user.avatar_url || user.photoURL, user.avatar_drive_id)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-text-muted">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1 mt-2 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-0.5">{currentRole || 'Guest'}</p>
                <p className="text-xs text-slate-400 truncate mt-1">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => nativeNavigate('/profile', router, 'TopBar:Profile')} className="text-sm py-2 cursor-pointer focus:bg-surface focus:text-white rounded-sm">
                <User size={16} className="mr-2 text-text-muted" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nativeNavigate('/settings', router, 'TopBar:Settings')} className="text-sm py-2 cursor-pointer focus:bg-surface focus:text-white rounded-sm">
                <Settings size={16} className="mr-2 text-text-muted" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-soft mx-1" />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                }}
                className="text-sm py-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-sm"
              >
                <LogOut size={16} className="mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ClientOnly>
    </header >
  );
}
