import React from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getDriveImageUrl } from '@/lib/driveUtils';
import { Badge } from '@/components/ui/badge';
import { UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadProfilePicture } from '@/services/profilePicture';
import { ThemeSelector } from './ThemeSelector';
import { AvatarUploadModal } from '../AvatarUploadModal';

export const ProfileSettingsView = () => {
    const { user } = useAuth();
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Basic validation
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setIsEditorOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset input to allow selecting same file again
        e.target.value = '';
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Public Profile</h3>
                <p className="text-sm text-slate-400">
                    This information will be displayed publicly to other team members.
                </p>
            </div>

            {/* Theme Selector */}
            <div className="space-y-4 pb-6 border-b border-white/5">
                <h4 className="text-sm font-medium text-slate-300">Appearance</h4>
                <ThemeSelector />
            </div>

            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                />
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden text-slate-500 border border-[#ffffff1a] shrink-0">
                    {user?.avatar_url || user?.photoURL ? (
                        <img src={getDriveImageUrl(user.avatar_url || user.photoURL, user.avatar_drive_id)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle size={48} />
                    )}
                </div>
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className="border-[#ffffff1a] text-slate-300 hover:text-white hover:bg-white/5"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Change Avatar
                    </Button>
                    <p className="text-xs text-slate-500">
                        JPG, GIF or PNG. 2MB max.
                    </p>
                </div>
            </div>

            <AvatarUploadModal
                isOpen={isEditorOpen}
                onClose={() => {
                    setIsEditorOpen(false);
                    setSelectedImage(null);
                }}
                imageSrc={selectedImage}
                userId={user?.uid || ''}
            />

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input
                        defaultValue={user?.name || ''}
                        readOnly
                        className="bg-slate-950/50 border-[#ffffff1a] text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500">Managed by Google Auth provider.</p>
                </div>

                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                        defaultValue={user?.email || ''}
                        readOnly
                        className="bg-slate-950/50 border-[#ffffff1a] text-slate-400 cursor-not-allowed"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-2">
                        <Badge variant="neutral" className="capitalize bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {user?.role || 'Guest'}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 opacity-50">
                <Button disabled className="bg-blue-600/50 text-white cursor-not-allowed">
                    Save Changes
                </Button>
                <span className="ml-4 text-xs text-slate-500">Profile editing disabled in Settings v1</span>
            </div>
        </div>
    );
};
