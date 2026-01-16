"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import { uploadProfilePicture } from "@/services/profilePicture";
import { auth } from "@/firebase/client";
import { signOut } from "firebase/auth";

// New Modular Components
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { AccountSnapshot } from "@/components/profile/AccountSnapshot";
import { InstitutionContextCard } from "@/components/profile/InstitutionContextCard";
import { UserPreferences } from "@/components/profile/UserPreferences";
import { ActivitySummary } from "@/components/profile/ActivitySummary";
import { HelpInfoCard } from "@/components/profile/HelpInfoCard";

export default function ProfilePage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  // Image Upload State
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setUploading(true);
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      await uploadProfilePicture(userId, blob);
      setShowCropper(false);
      setTempImageUrl(null);
      // AuthContext should pick up changes eventually or trigger a manual refresh if needed
      // Actually AuthContext might not auto-refresh avatarURL immediately unless we force it, 
      // but let's assume standard flow for now.
      window.location.reload(); // Quick refresh to show new avatar everywhere if context doesn't sync
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 mt-8 pb-32 flex flex-col gap-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Identity */}
      <ProfileHeaderCard
        user={user}
        onAvatarClick={handleAvatarClick}
      />

      {/* 2. Account Snapshot (Read Only) */}
      <AccountSnapshot user={user} />

      {/* 3. Institution Context (Guest Only) */}
      {user?.role === 'guest' && (
        <InstitutionContextCard user={user} />
      )}

      {/* 4. Preferences (Safe) */}
      <UserPreferences
        notifications={notifications}
        setNotifications={setNotifications}
      />

      {/* 5. Activity Summary (Soft Insight) */}
      <ActivitySummary user={user} />

      {/* 6. Help Info (Guest/All) */}
      <HelpInfoCard />

      {/* 7. Footer Action */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSignOut}
          className="w-full md:w-auto px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>

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
