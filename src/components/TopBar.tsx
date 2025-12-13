"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRole } from "@/app/(shell)/RoleContext";
import { useRouter } from 'next/navigation';
import ThemeToggle from "@/components/ThemeToggle";
import { addFocusVisibleClass } from "@/utils/a11y";
import { getProfilePictureUrl } from "@/services/profilePicture";
import { auth } from "@/firebase/client";

export default function TopBar({ title = "Thaiba MediaHive" }: { title?: string }) {
  const { user } = useRole();
  const router = useRouter();
  const notifRef = useRef<HTMLButtonElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (notifRef.current) addFocusVisibleClass(notifRef.current);

    // Load avatar from Firebase Storage
    async function loadAvatar() {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const url = await getProfilePictureUrl(userId);
        setAvatarUrl(url);
      }
    }

    loadAvatar();

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadAvatar();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-[var(--color-bg-glass)] backdrop-blur-md border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4 lg:px-8 transition-all">
      <div className="flex items-center gap-3">
        {/* Logo Icon */}
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/mediahive-icon.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-display font-bold text-xl text-[var(--color-text-primary)] hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/updates">
          <button ref={notifRef} aria-label="Notifications" className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
        </Link>
        <button
          onClick={() => router.push('/settings')}
          aria-label="Settings"
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
        >
          <Settings size={20} />
        </button>
        <Link href="/profile">
          <button aria-label="Profile" className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 hover:ring-2 hover:ring-blue-500 transition-all">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.fullName || "Profile"} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500" />
            )}
          </button>
        </Link>
      </div>
    </header>
  );
}