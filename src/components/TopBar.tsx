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
import { nativeNavigate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar({ title = "MediaHive" }: { title?: string }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

      {/* 2. Page Title (Strictly Mobile Only) */}
      <div className="hidden flex-1 items-center lg:hidden">
        <h2 className="text-sm font-medium text-text-muted capitalize">
          {currentRouteName}
        </h2>
      </div>

      {/* 3. Actions & Profile */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>

        <div className="h-4 w-[1px] bg-border-soft mx-2" />

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 rounded-full hover:bg-surface group transition-all"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface border border-border-soft flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
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
                nativeNavigate('/login', router, 'TopBar:Logout');
              }}
              className="text-sm py-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-sm"
            >
              <LogOut size={16} className="mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header >
  );
}
