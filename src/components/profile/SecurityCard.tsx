'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SecurityCard() {
    const [loading, setLoading] = useState(false);
    const [showFields, setShowFields] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdate = async () => {
        if (!password || password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ 
                password: password 
            });

            if (error) throw error;
            
            toast.success('Password updated successfully!');
            setPassword('');
            setConfirmPassword('');
            setShowFields(false);
        } catch (error: any) {
            console.error('Update password failed:', error);
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Lock size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Account Security</h3>
                        <p className="text-xs text-muted-foreground">Manage your authentication settings</p>
                    </div>
                </div>
                {!showFields && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFields(true)}
                        className="h-8 text-xs font-bold px-4"
                    >
                        Change Password
                    </Button>
                )}
            </div>

            {showFields && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-10 bg-surface border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-10 bg-surface border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setShowFields(false);
                                setPassword('');
                                setConfirmPassword('');
                            }}
                            className="h-9 text-xs font-medium"
                        >
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={handleUpdate}
                            disabled={loading}
                            className="h-9 bg-primary hover:bg-primary/90 text-foreground font-bold px-6 rounded-xl transition-all shadow-md active:scale-95"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
