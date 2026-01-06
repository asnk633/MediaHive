import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCircle } from 'lucide-react';

export const ProfileSettingsView = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Public Profile</h3>
                <p className="text-sm text-slate-400">
                    This information will be displayed publicly to other team members.
                </p>
            </div>

            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-white/10 shrink-0">
                    {/* Placeholder for Avatar */}
                    <UserCircle size={48} />
                </div>
                <div className="space-y-2">
                    <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                        Change Avatar
                    </Button>
                    <p className="text-xs text-slate-500">
                        JPG, GIF or PNG. 1MB max.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input
                        defaultValue={user?.name || ''}
                        readOnly
                        className="bg-slate-950/50 border-white/10 text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500">Managed by Google Auth provider.</p>
                </div>

                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                        defaultValue={user?.email || ''}
                        readOnly
                        className="bg-slate-950/50 border-white/10 text-slate-400 cursor-not-allowed"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize bg-blue-500/10 text-blue-400 border-blue-500/20">
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
