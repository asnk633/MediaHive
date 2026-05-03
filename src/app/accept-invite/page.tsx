'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, Loader2, CheckCircle2, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { OnboardingService } from '@/services/onboardingService';
import { AdminService } from '@/services/adminService';
import { OnboardingFlow } from '@/components/auth/OnboardingFlow';
import { toast } from 'sonner';

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [invite, setInvite] = useState<any>(null);
    const [resolvedWorkspaces, setResolvedWorkspaces] = useState<Array<{ id: string; name: string; role: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'validate' | 'setup' | 'onboarding'>('validate');

    // Form state
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Missing invitation token');
            setLoading(false);
            return;
        }
        validateToken();
    }, [token]);

    const validateToken = async () => {
        setLoading(true);
        try {
            const data = await OnboardingService.validateToken(token!);
            if (data) {
                setInvite(data);
                
                // Resolve workspace names
                const invited = data.metadata?.invited_workspaces || {};
                const ids = Object.keys(invited);
                if (ids.length > 0) {
                    const allWorkspaces = await AdminService.getAllWorkspaces();
                    const filtered = allWorkspaces
                        .filter(ws => ids.includes(ws.id))
                        .map(ws => ({
                            id: ws.id,
                            name: ws.name,
                            role: invited[ws.id]
                        }));
                    setResolvedWorkspaces(filtered);
                }

                setStep('setup');
            } else {
                setError('Invitation is invalid or has expired');
            }
        } catch (err) {
            setError('Failed to validate invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        if (password.length < 8) return toast.error('Password must be at least 8 characters');

        setSubmitting(true);
        try {
            await OnboardingService.acceptInvitation(token!, name, password);
            setStep('onboarding');
            toast.success('Account created successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Signup failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/[0.03] border border-white/5 rounded-[32px] p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                        <AlertCircle className="text-rose-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Oops! Something's wrong</h1>
                    <p className="text-white/40 text-sm leading-relaxed">{error}</p>
                    <button 
                        onClick={() => router.push('/login')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
                {step === 'setup' && (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="max-w-md w-full bg-white/[0.03] border border-white/5 rounded-[40px] p-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield size={120} />
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tighter leading-none mb-2">Welcome!</h1>
                                <p className="text-white/40 text-sm">You've been invited to join <b>MediaHive</b> as <span className="text-blue-400 font-bold">{invite.email}</span></p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Your Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Anas Mohamed"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                        <Building2 size={12} /> Workspaces Assigned
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {resolvedWorkspaces.length > 0 ? (
                                            resolvedWorkspaces.map(ws => (
                                                <span key={ws.id} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-white/50 uppercase tracking-tight">
                                                    {ws.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-white/20 italic">Global Access Only</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] mt-4"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            Complete Setup
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {step === 'onboarding' && (
                    <OnboardingFlow 
                        userName={name}
                        workspaces={resolvedWorkspaces}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
