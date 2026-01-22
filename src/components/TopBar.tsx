"use client";
import React, { useState } from "react";
import { Settings, User, WifiOff, LogOut, Package, Activity } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { SafeAvatar } from "@/components/ui/SafeAvatar";
import dynamic from 'next/dynamic';
const NotificationBell = dynamic(() => import('@/components/notifications/NotificationBell').then(mod => mod.NotificationBell), { ssr: false });
import { useAuth } from "@/contexts/AuthContext";

export default function TopBar({ title = "Thaiba MediaHive" }: { title?: string }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Role badge colors
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'team':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'guest':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-glass/95 backdrop-blur-xl border-b border-soft z-50 flex items-end justify-between px-4 lg:px-8 transition-all pb-3 shadow-sm pointer-events-auto" style={{ height: 'var(--header-height)', paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center gap-3">
        {/* Logo Icon */}
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/mediahive-icon.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-display font-semibold text-xl text-foreground hidden lg:block">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          onClick={() => router.push('/settings')}
          aria-label="Settings"
          className="p-2 rounded-full text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-foreground transition-colors"
        >
          <Settings size={20} strokeWidth={2.25} />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="User menu"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              <SafeAvatar
                src={user?.avatarUrl}
                alt={user?.name || "Profile"}
                size={32}
                className="w-full h-full"
              />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-foreground">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role || 'guest'}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-72 bg-card backdrop-blur-xl rounded-2xl shadow-strong border border-soft z-50 overflow-hidden">
                {/* User Info Section */}
                <div className="p-5 border-b border-soft bg-gradient-to-br from-primary/5 to-purple-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20">
                      <SafeAvatar
                        src={user?.avatarUrl}
                        alt={user?.name || "Profile"}
                        size={56}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground text-base truncate">{user?.name || 'User'}</div>
                      <div className="text-xs text-muted truncate">{user?.email}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">v{process.env.NEXT_PUBLIC_APP_VERSION || '2.5.1'}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${getRoleBadgeColor(user?.role || 'guest')}`}>
                    {user?.role || 'GUEST'}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="p-3 space-y-1">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface/50 transition-all group bg-gradient-to-r from-primary/5 to-purple-500/5 border border-soft mb-1 text-left"
                    >
                      <Activity size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <span className="text-sm font-bold text-foreground block">Command Center</span>
                        <span className="text-[10px] text-blue-300 block">System Operations</span>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/inventory/requests');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface/50 transition-all group text-left"
                  >
                    <Package size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-foreground">My Requests</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface/50 transition-all group text-left"
                  >
                    <User size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-foreground">View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/activity');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface/50 transition-all group text-left"
                  >
                    <Activity size={20} className="text-orange-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-foreground">Activity Feed</span>
                  </button>

                  <div className="pt-2 mt-2 border-t border-soft">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-all text-left group"
                    >
                      <LogOut size={20} className="text-destructive group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-destructive group-hover:text-destructive/80">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}