"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ChevronRight, Bell, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageCropper from "@/components/ImageCropper";
import { uploadProfilePicture } from "@/services/profilePicture";
import { auth } from "@/firebase/client";
import { signOut } from "firebase/auth";
import { getRoleBadgeColors } from "@/lib/roleStyles";
import { SafeAvatar } from "@/components/ui/SafeAvatar";

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.role;
  const [notifications, setNotifications] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state with user context
  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Read and show in cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTempImageUrl(base64String);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setUploading(true);
    try {
      // Convert base64 to Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const downloadURL = await uploadProfilePicture(userId, blob);

      // Update UI
      setAvatarUrl(downloadURL);
      setShowCropper(false);
      setTempImageUrl(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUrl(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 max-w-lg mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header / Avatar */}
      <div className="flex flex-col items-center pb-2">
        <div className="relative group">
          <button
            onClick={handleAvatarClick}
            className="h-28 w-28 rounded-full border-4 border-transparent shadow-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-blue-400 transition-all p-0"
          >
            <SafeAvatar
              src={avatarUrl}
              alt={user?.name || "Profile"}
              size={112} // 28 * 4
              className="w-full h-full bg-cover"
              priority={true}
            />
          </button>
          <button
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-lg border-4 border-[var(--bg-app)] hover:bg-blue-700 transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user?.name || "User Name"}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              getRoleBadgeColors(role)
            )}>
              {(user?.email === 'media@thaibagarden.com' || user?.isSuperAdmin) ? "SUPER ADMIN" : (role || "Guest")}
            </span>
            {/* Removed raw ID display as per user request */}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <section className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Account Information</h3>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          <ProfileRow icon={Mail} label="Email" value={user?.email || "No email"} onClick={() => alert('Email editing coming soon!')} />
          {/* Phone Number removed as per request */}
          <ProfileRow icon={Lock} label="Password" value="••••••••" action onClick={() => alert('Password change coming soon!')} />
        </div>
      </section>

      {/* App Settings */}
      <section className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Application Settings</h3>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          <ToggleRow
            icon={Bell}
            label="Push Notifications"
            checked={notifications}
            onChange={setNotifications}
          />
          {/* Dark Mode Toggle removed - Theme Locked to Night Sky */}
        </div>
      </section>


      {/* Logout */}
      <button
        onClick={async () => {
          try {
            await signOut(auth);
            // Clear any local storage
            localStorage.clear();
            // Redirect to login page
            window.location.href = '/login';
          } catch (error) {
            console.error('Error signing out:', error);
            alert('Failed to sign out. Please try again.');
          }
        }}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium transition-colors border border-red-200 dark:border-red-800"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      {/* Image Cropper Modal */}
      {showCropper && tempImageUrl && (
        <ImageCropper
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value, action, onClick }: { icon: any; label: string; value: string; action?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-[var(--bg-panel)] transition-all duration-200 ease-in-out group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-[var(--bg-panel)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all duration-200 ease-in-out">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
        </div>
      </div>
      {action && <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all duration-200 ease-in-out" />}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-panel)] transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-[var(--bg-panel)] text-[var(--text-muted)]">
          <Icon size={18} />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
      </div>

      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "w-11 h-6 rounded-full relative transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
