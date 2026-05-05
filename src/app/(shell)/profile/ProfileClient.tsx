// @ts-nocheck
'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import { uploadProfilePicture } from "@/services/profilePicture";

// New Modular Components
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { AccountSnapshot } from "@/components/profile/AccountSnapshot";
import { InstitutionContextCard } from "@/components/profile/InstitutionContextCard";
import { UserPreferences } from "@/components/profile/UserPreferences";
import { ActivitySummary } from "@/components/profile/ActivitySummary";
import { HelpInfoCard } from "@/components/profile/HelpInfoCard";
import { SecurityCard } from "@/components/profile/SecurityCard";

import { useRouter } from "next/navigation";
import { nativeNavigate } from "@/lib/utils";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { toast } from 'sonner';

export default function ProfileClient() {
    const { user, signOut, refreshUser } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [updatingName, setUpdatingName] = useState(false);

    // Image Upload State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.name) {
            setNewName(user.name);
        }
    }, [user?.name]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleNameUpdate = async () => {
        if (!user || !newName.trim()) return;
        setUpdatingName(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: newName.trim() })
                .eq('id', user.uid);

            if (error) throw error;
            
            toast.success('Display name updated!');
            setIsEditingName(false);
            if (refreshUser) await refreshUser();
            router.refresh();
        } catch (error) {
            console.error('Failed to update name:', error);
            toast.error('Failed to update name.');
        } finally {
            setUpdatingName(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image too large. Please choose a file under 5MB.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('Invalid file type. Please select an image (JPG, PNG).');
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
        if (!user) return;
        setUploading(true);
        setShowCropper(false);
        try {
            // Convert base64 to blob
            const response = await fetch(croppedImage);
            const blob = await response.blob();
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
            await uploadProfilePicture(user.uid, file);
            if (refreshUser) await refreshUser();
            router.refresh();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed. Please check your connection and try again.');
        } finally {
            setUploading(false);
            setTempImageUrl(null);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    return (
        <PageLayout mode="plain">
            <div className="space-y-6">
                {/* Profile Header Card */}
                <ProfileHeaderCard
                    user={user}
                    onAvatarClick={handleAvatarClick}
                    isEditingName={isEditingName}
                    setIsEditingName={setIsEditingName}
                    newName={newName}
                    setNewName={setNewName}
                    onSaveName={handleNameUpdate}
                    updatingName={updatingName}
                />

                {/* Grid Layout for Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AccountSnapshot user={user} />
                    <InstitutionContextCard user={user} />
                </div>

                {/* User Preferences */}
                <UserPreferences
                    notifications={notifications}
                    setNotifications={setNotifications}
                />

                {/* Account Security */}
                <SecurityCard />

                {/* Activity Summary */}
                <ActivitySummary user={user} />

                {/* Help & Info */}
                <HelpInfoCard />

                {/* Sign Out Button */}
                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleSignOut}
                        className="group flex items-center gap-3 px-6 py-3 bg-surface/90 hover:bg-red-500/10 border border-soft hover:border-red-500/30 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        <LogOut size={18} className="text-muted group-hover:text-red-500 transition-colors" />
                        <span className="font-medium text-foreground group-hover:text-red-500 transition-colors">
                            Sign Out
                        </span>
                    </button>
                </div>
            </div>

            {/* Hidden file input for profile picture */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Image Cropper Modal */}
            {showCropper && tempImageUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <ImageCropper
                        imageUrl={tempImageUrl}
                        onCropComplete={handleCropComplete}
                        onCancel={() => {
                            setShowCropper(false);
                            setTempImageUrl(null);
                        }}
                    />
                </div>
            )}
        </PageLayout>
    );
}
